import { NextResponse } from "next/server";

const FETCH_TIMEOUT = 10000;

async function fetchWithTimeout(url: string, init?: RequestInit, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err ?? "Unknown error");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const rawType = (url.searchParams.get("type") || "movie").toLowerCase();
    const page = url.searchParams.get("page") || "1";

    if (!q) {
      return NextResponse.json(
        { error: 'Missing query param "q". Example: /api/search?q=superman&type=movie&page=1' },
        { status: 400 }
      );
    }

    if (rawType !== "movie" && rawType !== "tv") {
      return NextResponse.json({ error: 'Invalid type. Use "movie" or "tv".' }, { status: 400 });
    }

    const rawBase = (process.env.SEARCH_ENDPOINT || "").replace(/\/+$/, "");
    if (!rawBase) {
      return NextResponse.json({ error: "SEARCH_ENDPOINT not set in env" }, { status: 500 });
    }

    const SEARCH_BASE = rawBase.replace(/\/search$/i, "");

    if (SEARCH_BASE.includes("themoviedb.org")) {
      const TMDB_BEARER = process.env.TMDB_BEARER;
      if (!TMDB_BEARER) {
        return NextResponse.json({ error: "TMDB_BEARER env var is not set" }, { status: 500 });
      }

      const target = `${SEARCH_BASE}/search/${rawType}?include_adult=false&language=en-US&page=${encodeURIComponent(
        page
      )}&query=${encodeURIComponent(q)}`;

      const res = await fetchWithTimeout(target, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_BEARER}`,
        },
      });

      if (!res) return NextResponse.json({ error: "No response from upstream" }, { status: 502 });
      if (!res.ok) {
        return NextResponse.json(
          { error: "Upstream search failed", status: res.status, statusText: res.statusText },
          { status: 502 }
        );
      }

      const data = await res.json();
      return NextResponse.json(data, { status: 200 });
    }

    const genericTarget = `${SEARCH_BASE}/search/${rawType}/${encodeURIComponent(q)}?page=${encodeURIComponent(page)}`;

    const gres = await fetchWithTimeout(genericTarget, { method: "GET", headers: { accept: "application/json" } });

    if (!gres) return NextResponse.json({ error: "No response from upstream" }, { status: 502 });
    if (!gres.ok) {
      return NextResponse.json(
        { error: "Upstream search failed", status: gres.status, statusText: gres.statusText },
        { status: 502 }
      );
    }

    const gdata = await gres.json();
    return NextResponse.json(gdata, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof DOMException && err.name === "AbortError" ? "upstream request timed out" : getErrorMessage(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}