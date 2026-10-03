import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const api = "https://api.hadith.gading.dev";
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;
const buckets = new Map<string, { startedAt: number; count: number }>();

function limited(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

const books = new Set(["bukhari", "muslim", "abu-dawud", "tirmidzi", "nasai", "ibnu-majah", "ahmad", "darimi", "malik"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(clientKey)) {
    return Response.json({ error: "Rate limit exceeded. Try again later." }, {
      status: 429,
      headers: { ...cors, "Retry-After": "60" },
    });
  }

  try {
    const { action = "random", book = "bukhari", number, from = 1, to = 10 } = await req.json();
    if (!books.has(book)) throw new Error("Unsupported hadith book");

    let path = "";
    if (action === "random") path = `/books/${book}/${Math.floor(Math.random() * 1000) + 1}`;
    else if (action === "one") {
      const n = Number(number);
      if (!Number.isInteger(n) || n < 1) throw new Error("Invalid hadith number");
      path = `/books/${book}/${n}`;
    } else if (action === "range") {
      const start = Math.max(1, Number(from));
      const end = Math.min(start + 29, Math.max(start, Number(to)));
      if (!Number.isInteger(start) || !Number.isInteger(end)) throw new Error("Invalid hadith range");
      path = `/books/${book}?range=${start}-${end}`;
    } else {
      throw new Error("Unsupported hadith action");
    }

    const c = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const key = `hadith:${path}`;
    const { data: old } = await c.from("islamway_cache").select("payload,expires_at").eq("cache_key", key).maybeSingle();
    if (old && new Date(old.expires_at) > new Date()) return Response.json(old.payload, { headers: cors });

    const response = await fetch(api + path, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Hadith API HTTP ${response.status}`);
    const payload = await response.json();

    await c.from("islamway_cache").upsert({
      cache_key: key,
      payload,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    return Response.json(payload, { headers: cors });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500, headers: cors },
    );
  }
});
