/**
 * Daily sales briefing ingest: RSS + Tavily → AI summarize & relate → sales_briefs.
 *
 * Auth: verify_jwt = false; requires header `x-cron-secret` matching CRON_SECRET
 * (or Authorization Bearer CRON_SECRET). Service role writes to the DB.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion, mapAiHttpError } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const LIBRARY_CATALOG = `
Valid related_slugs (use only these):
- sales-psychology — purchase psychology, risk-first selling, cognitive empathy, adaptive selling, decision fatigue, Dark Funnel, buying committees
- enterprise-playbook — MEDDPICC, SPIN, enterprise deals, champion enablement, bundles
- smb-playbook — SMB qualify, short demos, land-and-expand
- people-path — narrative demos, lifecycle story demos
- us-caribbean-battlecards — competitive positioning, HiBob, Personio, battle cards
- hr-mockup — HR product UI reference (rarely relevant)
`;

interface Candidate {
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  snippet: string;
}

interface EnrichedBrief {
  title: string;
  url: string;
  source_name: string;
  published_at: string | null;
  summary: string;
  topics: string[];
  related_slugs: string[];
  keep: boolean;
}

const RSS_FEEDS: { name: string; url: string }[] = [
  { name: "HubSpot Sales", url: "https://blog.hubspot.com/sales/rss.xml" },
  { name: "Salesforce Blog", url: "https://www.salesforce.com/blog/feed/" },
  { name: "Close Blog", url: "https://blog.close.com/rss/" },
];

const TAVILY_QUERIES = [
  "B2B sales enablement best practices",
  "MEDDPICC OR champion selling OR buying committee 2025 OR 2026",
  "sales discovery SPIN OR loss aversion OR empathy enterprise SaaS",
];

const VALID_SLUGS = new Set([
  "sales-psychology",
  "enterprise-playbook",
  "smb-playbook",
  "people-path",
  "us-caribbean-battlecards",
  "hr-mockup",
  "sales-psychology-md",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!authorizeCron(req)) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Missing Supabase service credentials" }, 500);
    }
    const admin = createClient(supabaseUrl, serviceKey);

    const candidates = await collectCandidates();
    const unique = dedupeByUrl(candidates).slice(0, 18);

    const { data: existing } = await admin.from("sales_briefs").select("url");
    const known = new Set((existing ?? []).map((r: { url: string }) => r.url));
    const fresh = unique.filter((c) => !known.has(c.url)).slice(0, 10);

    if (fresh.length === 0) {
      return json({ ok: true, inserted: 0, message: "No new articles" }, 200);
    }

    const enriched = await enrichWithAi(fresh);
    const rows = enriched
      .filter((b) => b.keep && b.summary.trim().length > 40)
      .map((b) => ({
        title: b.title.slice(0, 300),
        url: b.url,
        source_name: b.source_name.slice(0, 120),
        published_at: b.published_at,
        summary: b.summary.slice(0, 1200),
        topics: (b.topics ?? []).slice(0, 8),
        related_slugs: (b.related_slugs ?? []).filter((s) => VALID_SLUGS.has(s)).slice(0, 4),
      }));

    if (rows.length === 0) {
      return json({ ok: true, inserted: 0, message: "AI kept none" }, 200);
    }

    const { error } = await admin.from("sales_briefs").upsert(rows, {
      onConflict: "url",
      ignoreDuplicates: true,
    });
    if (error) {
      console.error("[sales-briefing-ingest] upsert:", error);
      return json({ error: error.message }, 500);
    }

    return json({ ok: true, inserted: rows.length, candidates: unique.length }, 200);
  } catch (e) {
    console.error("[sales-briefing-ingest]:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function authorizeCron(req: Request): boolean {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    // Allow service-role JWT if CRON_SECRET not set (local/dev).
    const auth = req.headers.get("Authorization") ?? "";
    return auth.startsWith("Bearer ");
  }
  const headerSecret = req.headers.get("x-cron-secret") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return headerSecret === secret || bearer === secret;
}

async function collectCandidates(): Promise<Candidate[]> {
  const fromRss = (
    await Promise.all(RSS_FEEDS.map((f) => fetchRssFeed(f.name, f.url).catch((e) => {
      console.error("[sales-briefing-ingest] RSS fail", f.name, e);
      return [] as Candidate[];
    })))
  ).flat();

  const fromTavily = await fetchTavilyCandidates().catch((e) => {
    console.error("[sales-briefing-ingest] Tavily fail", e);
    return [] as Candidate[];
  });

  return [...fromRss, ...fromTavily];
}

async function fetchRssFeed(sourceName: string, feedUrl: string): Promise<Candidate[]> {
  const resp = await fetch(feedUrl, {
    headers: { "User-Agent": "KeptBriefingBot/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!resp.ok) return [];
  const xml = await resp.text();
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].slice(0, 8);
  const out: Candidate[] = [];
  for (const m of items) {
    const block = m[0];
    const title = decodeXml(pickTag(block, "title"));
    const link = decodeXml(pickTag(block, "link") || pickAttr(block, "guid"));
    const pub = pickTag(block, "pubDate") || pickTag(block, "dc:date");
    const desc = decodeXml(stripTags(pickTag(block, "description") || pickTag(block, "content:encoded")));
    if (!title || !link || !link.startsWith("http")) continue;
    out.push({
      title,
      url: normalizeUrl(link),
      source_name: sourceName,
      published_at: pub ? new Date(pub).toISOString() : null,
      snippet: desc.slice(0, 280),
    });
  }
  return out;
}

async function fetchTavilyCandidates(): Promise<Candidate[]> {
  const apiKey = Deno.env.get("TAVILY_API_KEY");
  if (!apiKey) return [];

  const results: Candidate[] = [];
  for (const query of TAVILY_QUERIES) {
    const resp = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 5,
        topic: "news",
        days: 14,
        include_answer: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) {
      console.error("[sales-briefing-ingest] Tavily HTTP", resp.status, await resp.text());
      continue;
    }
    const data = (await resp.json()) as {
      results?: { title?: string; url?: string; content?: string; published_date?: string }[];
    };
    for (const r of data.results ?? []) {
      if (!r.title || !r.url) continue;
      let host = "";
      try {
        host = new URL(r.url).hostname.replace(/^www\./, "");
      } catch {
        continue;
      }
      results.push({
        title: r.title,
        url: normalizeUrl(r.url),
        source_name: host,
        published_at: r.published_date ? new Date(r.published_date).toISOString() : null,
        snippet: (r.content ?? "").slice(0, 280),
      });
    }
  }
  return results;
}

async function enrichWithAi(candidates: Candidate[]): Promise<EnrichedBrief[]> {
  const payload = candidates.map((c, i) => ({
    i,
    title: c.title,
    url: c.url,
    source: c.source_name,
    published_at: c.published_at,
    snippet: c.snippet,
  }));

  const system = `You curate a daily sales briefing for B2B sales executives inside Kept Executive Academy.
For each candidate, decide keep=true only if it is useful for sellers (methodology, psychology, demos, competition, enablement). Reject fluff, product ads, and unrelated tech news.
Write a 2–4 sentence practical summary in clear English (no em dashes). Suggest topics and related_slugs from the catalog.
Return ONLY valid JSON: { "items": [ { "i": number, "keep": boolean, "summary": string, "topics": string[], "related_slugs": string[] } ] }

${LIBRARY_CATALOG}`;

  const aiResp = await chatCompletion({
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify({ candidates: payload }) },
    ],
  });

  const aiError = await mapAiHttpError(aiResp, "sales-briefing-ingest");
  if (aiError) {
    // Fallback: keep all with snippet as summary
    return candidates.map((c) => ({
      ...c,
      summary: c.snippet || c.title,
      topics: ["sales"],
      related_slugs: [],
      keep: true,
    }));
  }

  const data = await aiResp.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = extractJson(raw) as { items?: { i: number; keep: boolean; summary: string; topics?: string[]; related_slugs?: string[] }[] };
  const byIndex = new Map((parsed.items ?? []).map((it) => [it.i, it]));

  return candidates.map((c, i) => {
    const it = byIndex.get(i);
    return {
      ...c,
      summary: it?.summary?.trim() || c.snippet || c.title,
      topics: it?.topics ?? [],
      related_slugs: it?.related_slugs ?? [],
      keep: it?.keep ?? true,
    };
  });
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1] ?? text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end < 0) return {};
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return {};
  }
}

function dedupeByUrl(items: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const item of items) {
    const key = normalizeUrl(item.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, url: key });
  }
  return out;
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    return u.toString();
  } catch {
    return url.trim();
  }
}

function pickTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return (m?.[1] ?? m?.[2] ?? "").trim();
}

function pickAttr(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([^<]+)`, "i"));
  return (m?.[1] ?? "").trim();
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
