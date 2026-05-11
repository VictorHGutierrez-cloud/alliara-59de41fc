// delete-guidance — server-side fallback for deleting an ai_recommendations row.
// Verifies the caller owns the partner that the guidance belongs to (or is leadership/admin),
// then deletes using the service-role key to bypass any RLS edge cases.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Missing auth" }, 401);

    const { recId } = (await req.json()) as { recId?: string };
    if (!recId) return json({ error: "recId required" }, 400);

    // Identify the caller from their JWT.
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "Invalid session" }, 401);
    const userId = userRes.user.id;

    // Service-role client for the actual lookup + delete.
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: rec, error: recErr } = await admin
      .from("ai_recommendations")
      .select("id, partner_id")
      .eq("id", recId)
      .maybeSingle();
    if (recErr) return json({ error: recErr.message }, 500);
    if (!rec) return json({ error: "Guidance not found" }, 404);

    const { data: partner, error: pErr } = await admin
      .from("partners")
      .select("id, owner_id")
      .eq("id", rec.partner_id)
      .maybeSingle();
    if (pErr) return json({ error: pErr.message }, 500);
    if (!partner) return json({ error: "Partner not found" }, 404);

    let allowed = partner.owner_id === userId;
    if (!allowed) {
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      allowed = (roles ?? []).some((r) => r.role === "leadership" || r.role === "admin");
    }
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const { error: delErr } = await admin
      .from("ai_recommendations")
      .delete()
      .eq("id", recId);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true }, 200);
  } catch (e) {
    console.error("delete-guidance error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});