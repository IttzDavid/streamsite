import { NextRequest, NextResponse } from "next/server";

function normalizeBase(raw: string) {
  return raw.replace(/\/+$/, "").replace(/\/search$/i, "");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const typeRaw = (searchParams.get("type") || "movie").toLowerCase();
  const type = typeRaw === "tv" ? "tv" : "movie";

  if (!q) {
    return NextResponse.json({ results: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const base = normalizeBase(process.env.SEARCH_ENDPOINT || "https://api.themoviedb.org/3");
  const bearer = process.env.TMDB_BEARER;
  if (!bearer) {
    return NextResponse.json({ error: "TMDB_BEARER not configured" }, { status: 500 });
  }

  const url = `${base}/search/${type}?language=en-US&query=${encodeURIComponent(q)}&page=1&include_adult=false`;
  const res = await fetch(url, {
    headers: { accept: "application/json", Authorization: `Bearer ${bearer}` },
    // keep search fresh
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ results: data.results ?? [] });
}