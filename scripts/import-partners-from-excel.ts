import { readFile, writeFile } from "node:fs/promises";
import xlsxPkg from "xlsx";
const xlsx = (xlsxPkg as unknown as { default?: typeof xlsxPkg }).default ?? xlsxPkg;
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";

type PartnerInsert = Database["public"]["Tables"]["partners"]["Insert"];
type PartnerUpdate = Database["public"]["Tables"]["partners"]["Update"];
type PartnerRow = Database["public"]["Tables"]["partners"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PartnerStatus = Database["public"]["Enums"]["partner_status"];
type PartnerTier = Database["public"]["Enums"]["partner_tier"];
type PartnerType = Database["public"]["Enums"]["partner_type"];

interface NormalizedOwner {
  id: string;
  displayName: string;
  normalized: string;
  tokens: string[];
}

interface OwnerMatchResult {
  ownerId: string | null;
  ownerDisplayName: string | null;
  reason:
    | "exact"
    | "fuzzy"
    | "ambiguous_exact"
    | "ambiguous_fuzzy"
    | "missing_owner_name"
    | "no_match";
  candidates: ReadonlyArray<NormalizedOwner>;
}

interface ParsedRow {
  rowNumber: number;
  name: string;
  ownerRaw: string;
  normalizedName: string;
  hubspotCompanyId: number | null;
  company: string | null;
  segment: string | null;
  status: PartnerStatus;
  tier: PartnerTier;
  partnerType: PartnerType;
  metrics: Record<string, string | number | null>;
}

interface ConflictEntry {
  rowNumber: number;
  partnerName: string;
  ownerRaw: string;
  issue: "missing_owner" | "owner_ambiguous" | "existing_duplicate_key";
  chosenOwnerId: string | null;
  chosenOwnerDisplayName: string | null;
  candidates: ReadonlyArray<{ id: string; displayName: string }>;
}

interface RunStats {
  totalRows: number;
  parsedRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  unresolvedOwners: number;
  ambiguousOwners: number;
  duplicateExistingKeys: number;
}

interface CliOptions {
  filePath: string;
  sheetName: string;
  dryRun: boolean;
  limit: number | null;
  conflictsOutPath: string | null;
}

const DEFAULT_FILE_PATH =
  "/Users/victor.gutierrez/Downloads/hubspot-custom-report-full-partners-data-2026-05-14.xlsx";
const DEFAULT_SHEET = "Full Partners DATA";

function normalizeName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(normalized: string): string[] {
  return normalized.split(" ").filter(Boolean);
}

function isSubset(
  sourceTokens: ReadonlyArray<string>,
  targetTokens: ReadonlyArray<string>,
): boolean {
  if (sourceTokens.length === 0 || targetTokens.length === 0) return false;
  const targetSet = new Set(targetTokens);
  return sourceTokens.every((token) => targetSet.has(token));
}

function scoreOwnerMatch(ownerName: string, candidate: NormalizedOwner): number {
  const normalizedOwner = normalizeName(ownerName);
  const ownerTokens = tokenize(normalizedOwner);
  const candidateTokens = candidate.tokens;

  if (normalizedOwner === candidate.normalized) return 100;
  if (
    candidate.normalized.startsWith(normalizedOwner) ||
    normalizedOwner.startsWith(candidate.normalized)
  )
    return 80;
  if (ownerTokens.length > 1 && candidateTokens.length > 1) {
    if (ownerTokens.join(" ") === candidateTokens.join(" ")) return 70;
    if (isSubset(ownerTokens, candidateTokens) || isSubset(candidateTokens, ownerTokens)) return 60;
  }

  let overlap = 0;
  const candidateSet = new Set(candidateTokens);
  for (const token of ownerTokens) {
    if (candidateSet.has(token)) overlap += 1;
  }
  if (overlap > 0) {
    return 40 + overlap;
  }

  return 0;
}

function matchOwner(
  ownerName: string,
  candidates: ReadonlyArray<NormalizedOwner>,
): OwnerMatchResult {
  const normalizedOwner = normalizeName(ownerName);
  if (!normalizedOwner) {
    return {
      ownerId: null,
      ownerDisplayName: null,
      reason: "missing_owner_name",
      candidates: [],
    };
  }

  const exactMatches = candidates
    .filter((candidate) => candidate.normalized === normalizedOwner)
    .sort((a, b) => a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id));

  if (exactMatches.length === 1) {
    return {
      ownerId: exactMatches[0].id,
      ownerDisplayName: exactMatches[0].displayName,
      reason: "exact",
      candidates: exactMatches,
    };
  }

  if (exactMatches.length > 1) {
    return {
      ownerId: exactMatches[0].id,
      ownerDisplayName: exactMatches[0].displayName,
      reason: "ambiguous_exact",
      candidates: exactMatches,
    };
  }

  const scored = candidates
    .map((candidate) => ({ candidate, score: scoreOwnerMatch(ownerName, candidate) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.candidate.displayName.localeCompare(b.candidate.displayName) ||
        a.candidate.id.localeCompare(b.candidate.id),
    );

  if (scored.length === 0) {
    return {
      ownerId: null,
      ownerDisplayName: null,
      reason: "no_match",
      candidates: [],
    };
  }

  const bestScore = scored[0].score;
  const best = scored.filter((entry) => entry.score === bestScore).map((entry) => entry.candidate);

  if (best.length > 1) {
    return {
      ownerId: best[0].id,
      ownerDisplayName: best[0].displayName,
      reason: "ambiguous_fuzzy",
      candidates: best,
    };
  }

  return {
    ownerId: best[0].id,
    ownerDisplayName: best[0].displayName,
    reason: "fuzzy",
    candidates: best,
  };
}

function parseYesNoToStatus(rawValue: unknown): PartnerStatus {
  const value = String(rawValue ?? "")
    .trim()
    .toLowerCase();
  if (value === "yes" || value === "true") return "active";
  if (value === "no" || value === "false") return "paused";
  return "active";
}

function inferTier(rawValue: unknown): PartnerTier {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) return "emerging";
  if (numeric >= 200_000) return "strategic";
  if (numeric >= 50_000) return "core";
  if (numeric >= 5_000) return "emerging";
  return "long_tail";
}

function toOptionalString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text || text === "(No value)") return null;
  return text;
}

function toOptionalNumber(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(numberValue)) return null;
  return numberValue;
}

function parseOptions(args: ReadonlyArray<string>): CliOptions {
  let filePath = DEFAULT_FILE_PATH;
  let sheetName = DEFAULT_SHEET;
  let dryRun = true;
  let limit: number | null = null;
  let conflictsOutPath: string | null = null;

  for (const arg of args) {
    if (arg === "--execute") {
      dryRun = false;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg.startsWith("--file=")) {
      filePath = arg.slice("--file=".length);
      continue;
    }
    if (arg.startsWith("--sheet=")) {
      sheetName = arg.slice("--sheet=".length);
      continue;
    }
    if (arg.startsWith("--limit=")) {
      const rawLimit = Number(arg.slice("--limit=".length));
      if (!Number.isFinite(rawLimit) || rawLimit <= 0) {
        throw new Error(`Invalid --limit value: ${arg}`);
      }
      limit = Math.trunc(rawLimit);
      continue;
    }
    if (arg.startsWith("--conflicts-out=")) {
      conflictsOutPath = arg.slice("--conflicts-out=".length);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { filePath, sheetName, dryRun, limit, conflictsOutPath };
}

function parseSheet(filePath: string, sheetName: string): ParsedRow[] {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(
      `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`,
    );
  }

  const rawRows: Record<string, unknown>[] = xlsx.utils.sheet_to_json(sheet, { defval: null });
  const parsedRows: ParsedRow[] = [];

  rawRows.forEach((rawRow, index) => {
    const name = toOptionalString(rawRow["Name"]) ?? "";
    const ownerRaw = toOptionalString(rawRow["Owner"]) ?? "";
    const normalizedName = normalizeName(name);
    if (!normalizedName) return;

    const partnerId = toOptionalNumber(rawRow["Partner ID"]);
    const parsed: ParsedRow = {
      rowNumber: index + 2,
      name,
      ownerRaw,
      normalizedName,
      hubspotCompanyId: partnerId ? Math.trunc(partnerId) : null,
      company: toOptionalString(rawRow["Name"]),
      segment: toOptionalString(rawRow["Country team"]),
      status: parseYesNoToStatus(rawRow["Active partner?"]),
      tier: inferTier(rawRow["Amount total deals"]),
      partnerType: "referral",
      metrics: {
        partner_id_raw: toOptionalString(rawRow["Partner ID"]),
        amount_total_deals: toOptionalNumber(rawRow["Amount total deals"]),
        amount_closed_won_deals: toOptionalNumber(rawRow["Amount of closed won deals"]),
        number_closed_won_deals_total: toOptionalNumber(
          rawRow["Number of closed won deals - total"],
        ),
        average_monthly_mrr_won: toOptionalNumber(rawRow["Average Monthly MRR Won"]),
        average_monthly_won_customer: toOptionalNumber(rawRow["Average Monthly Won Customer"]),
        number_demos_last_3_months: toOptionalNumber(rawRow["Number of demos in last 3 months"]),
        number_total_deals: toOptionalNumber(rawRow["Number of total deals"]),
        became_partner_activated_date: toOptionalString(rawRow["Became a Partner Activated date"]),
        became_new_partner_date: toOptionalString(rawRow["Became a New Partner Date"]),
        last_deal_created_date: toOptionalString(rawRow["Last deal created date"]),
      },
    };
    parsedRows.push(parsed);
  });

  return parsedRows;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function loadDotEnvIfPresent(filePath: string): Promise<void> {
  try {
    const content = await readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function main(): Promise<void> {
  await loadDotEnvIfPresent(".env");
  const options = parseOptions(process.argv.slice(2));
  console.log(`[import-partners] Starting ${options.dryRun ? "dry-run" : "execute"} mode`);
  console.log(`[import-partners] File: ${options.filePath}`);
  console.log(`[import-partners] Sheet: ${options.sheetName}`);

  const SUPABASE_URL = requireEnv("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const parsedRows = parseSheet(options.filePath, options.sheetName);
  const inputRows = options.limit ? parsedRows.slice(0, options.limit) : parsedRows;
  console.log(
    `[import-partners] Parsed rows: ${parsedRows.length}. Using rows: ${inputRows.length}`,
  );

  const [{ data: owners, error: ownerError }, { data: existingPartners, error: existingError }] =
    await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase
        .from("partners")
        .select(
          "id, owner_id, hubspot_company_id, name, company, status, tier, segment, partner_type, notes",
        ),
    ]);

  if (ownerError) throw new Error(`[import-partners] Failed loading owners: ${ownerError.message}`);
  if (existingError)
    throw new Error(`[import-partners] Failed loading existing partners: ${existingError.message}`);

  const normalizedOwners: NormalizedOwner[] = (owners ?? [])
    .filter(
      (owner: Pick<ProfileRow, "id" | "display_name">) =>
        owner.display_name != null && owner.display_name.trim().length > 0,
    )
    .map((owner: Pick<ProfileRow, "id" | "display_name">) => {
      const displayName = String(owner.display_name);
      const normalized = normalizeName(displayName);
      return {
        id: owner.id,
        displayName,
        normalized,
        tokens: tokenize(normalized),
      };
    });

  const partnerRows = (existingPartners ?? []) as PartnerRow[];
  const existingByOwnerHubspot = new Map<string, PartnerRow>();
  const existingByOwnerName = new Map<string, PartnerRow>();
  const conflicts: ConflictEntry[] = [];

  for (const existing of partnerRows) {
    if (existing.hubspot_company_id != null) {
      const key = `${existing.owner_id}:${existing.hubspot_company_id}`;
      const already = existingByOwnerHubspot.get(key);
      if (already) {
        conflicts.push({
          rowNumber: 0,
          partnerName: existing.name,
          ownerRaw: existing.owner_id,
          issue: "existing_duplicate_key",
          chosenOwnerId: existing.owner_id,
          chosenOwnerDisplayName: null,
          candidates: [
            { id: already.id, displayName: already.name },
            { id: existing.id, displayName: existing.name },
          ],
        });
      } else {
        existingByOwnerHubspot.set(key, existing);
      }
    }
    const nameKey = `${existing.owner_id}:${normalizeName(existing.name)}`;
    if (!existingByOwnerName.has(nameKey)) {
      existingByOwnerName.set(nameKey, existing);
    }
  }

  const stats: RunStats = {
    totalRows: inputRows.length,
    parsedRows: parsedRows.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    unresolvedOwners: 0,
    ambiguousOwners: 0,
    duplicateExistingKeys: conflicts.filter((entry) => entry.issue === "existing_duplicate_key")
      .length,
  };

  for (const row of inputRows) {
    const ownerMatch = matchOwner(row.ownerRaw, normalizedOwners);
    if (!ownerMatch.ownerId) {
      stats.skipped += 1;
      stats.unresolvedOwners += 1;
      conflicts.push({
        rowNumber: row.rowNumber,
        partnerName: row.name,
        ownerRaw: row.ownerRaw,
        issue: "missing_owner",
        chosenOwnerId: null,
        chosenOwnerDisplayName: null,
        candidates: [],
      });
      continue;
    }

    if (ownerMatch.reason === "ambiguous_exact" || ownerMatch.reason === "ambiguous_fuzzy") {
      stats.ambiguousOwners += 1;
      conflicts.push({
        rowNumber: row.rowNumber,
        partnerName: row.name,
        ownerRaw: row.ownerRaw,
        issue: "owner_ambiguous",
        chosenOwnerId: ownerMatch.ownerId,
        chosenOwnerDisplayName: ownerMatch.ownerDisplayName,
        candidates: ownerMatch.candidates.map((candidate) => ({
          id: candidate.id,
          displayName: candidate.displayName,
        })),
      });
    }

    const partnerKeyByHubspot =
      row.hubspotCompanyId == null ? null : `${ownerMatch.ownerId}:${row.hubspotCompanyId}`;
    const partnerKeyByName = `${ownerMatch.ownerId}:${row.normalizedName}`;
    const existingByHubspot = partnerKeyByHubspot
      ? existingByOwnerHubspot.get(partnerKeyByHubspot)
      : undefined;
    const existing = existingByHubspot ?? existingByOwnerName.get(partnerKeyByName);

    const importNotes = {
      source: "excel-partners-import",
      imported_at: new Date().toISOString(),
      dry_run: options.dryRun,
      owner_raw: row.ownerRaw,
      owner_match_reason: ownerMatch.reason,
      metrics: row.metrics,
    };

    if (existing) {
      const updatePayload: PartnerUpdate = {
        name: row.name,
        company: row.company ?? existing.company,
        owner_id: ownerMatch.ownerId,
        hubspot_company_id: row.hubspotCompanyId ?? existing.hubspot_company_id,
        status: row.status ?? existing.status,
        tier: existing.tier ?? row.tier,
        segment: row.segment ?? existing.segment,
        partner_type: existing.partner_type ?? row.partnerType,
        // Preserve existing notes; only fill when empty.
        notes:
          existing.notes != null && String(existing.notes).trim().length > 0
            ? existing.notes
            : JSON.stringify(importNotes),
      };

      if (!options.dryRun) {
        const { error } = await supabase
          .from("partners")
          .update(updatePayload)
          .eq("id", existing.id);
        if (error)
          throw new Error(
            `[import-partners] Failed to update partner ${existing.id}: ${error.message}`,
          );
      }

      stats.updated += 1;
      continue;
    }

    const insertPayload: PartnerInsert = {
      name: row.name,
      company: row.company,
      owner_id: ownerMatch.ownerId,
      hubspot_company_id: row.hubspotCompanyId,
      status: row.status,
      tier: row.tier,
      segment: row.segment,
      partner_type: row.partnerType,
      notes: JSON.stringify(importNotes),
    };

    if (!options.dryRun) {
      const { data, error } = await supabase
        .from("partners")
        .insert(insertPayload)
        .select("id, owner_id, hubspot_company_id, name")
        .single();
      if (error)
        throw new Error(`[import-partners] Failed to insert partner ${row.name}: ${error.message}`);
      const inserted = data as Pick<PartnerRow, "id" | "owner_id" | "hubspot_company_id" | "name">;
      if (inserted.hubspot_company_id != null) {
        existingByOwnerHubspot.set(`${inserted.owner_id}:${inserted.hubspot_company_id}`, {
          ...insertPayload,
          id: inserted.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          hubspot_company_id: inserted.hubspot_company_id,
          company: insertPayload.company ?? null,
          notes: insertPayload.notes ?? null,
        } as PartnerRow);
      }
      existingByOwnerName.set(`${inserted.owner_id}:${normalizeName(inserted.name)}`, {
        ...insertPayload,
        id: inserted.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        hubspot_company_id: inserted.hubspot_company_id,
        company: insertPayload.company ?? null,
        notes: insertPayload.notes ?? null,
      } as PartnerRow);
    }

    stats.inserted += 1;
  }

  if (options.conflictsOutPath) {
    await writeFile(options.conflictsOutPath, JSON.stringify(conflicts, null, 2), "utf8");
    console.log(`[import-partners] Conflict report saved to ${options.conflictsOutPath}`);
  }

  console.log("[import-partners] Done");
  console.log(
    JSON.stringify(
      {
        mode: options.dryRun ? "dry-run" : "execute",
        filePath: options.filePath,
        sheetName: options.sheetName,
        stats,
        conflictCount: conflicts.length,
      },
      null,
      2,
    ),
  );

  if (conflicts.length > 0) {
    console.log("[import-partners] Conflicts:");
    conflicts.slice(0, 20).forEach((conflict) => {
      const candidates = conflict.candidates
        .map((candidate) => `${candidate.displayName} (${candidate.id})`)
        .join(", ");
      console.log(
        ` - row=${conflict.rowNumber} issue=${conflict.issue} partner="${conflict.partnerName}" owner_raw="${conflict.ownerRaw}" chosen="${conflict.chosenOwnerDisplayName ?? "none"}" candidates=[${candidates}]`,
      );
    });
    if (conflicts.length > 20) {
      console.log(` - ... ${conflicts.length - 20} more conflicts`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[import-partners] Fatal error: ${message}`);
  process.exit(1);
});
