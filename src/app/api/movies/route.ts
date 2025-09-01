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

export async function GET(request: Request) {
  const MOVIE_ENDPOINT_RAW = process.env.MOVIE_ENDPOINT;
  if (!MOVIE_ENDPOINT_RAW) {
    return NextResponse.json({ error: "MOVIE_ENDPOINT env var is not set" }, { status: 500 });
  }

  const base = MOVIE_ENDPOINT_RAW.replace(/\/+$/, "");

  try {
    const incoming = new URL(request.url);
    const params = incoming.searchParams;

    const tmdb = params.get("tmdb");
    if (!tmdb) {
      return NextResponse.json({ error: "tmdb query param is required" }, { status: 400 });
    }

    const allowed = ["ds_lang", "sub_url", "autoplay", "imdb"];
    const forward = new URL(`${base}/embed/movie/${encodeURIComponent(tmdb)}`);
    for (const key of allowed) {
      const v = params.get(key);
      if (v) forward.searchParams.set(key, v);
    }

    const target = forward.toString();

    const apiRes = await fetchWithTimeout(target, {
      method: "GET",
      headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    });

    if (!apiRes) {
      return NextResponse.json({ error: "No response from upstream" }, { status: 502 });
    }

    const contentType = apiRes.headers.get("content-type") || "text/plain";

    if (contentType.includes("application/json")) {
      const data = await apiRes.json();
      return NextResponse.json(data, { status: apiRes.status });
    }

    const body = apiRes.body;
    const headers: Record<string, string> = { "Content-Type": contentType };
    return new Response(body, { status: apiRes.status, headers });
  } catch (err: unknown) {
    const msg = err instanceof DOMException && err.name === "AbortError" ? "upstream request timed out" : getErrorMessage(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}