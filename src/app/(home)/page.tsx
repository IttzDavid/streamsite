import React from "react";
import ClientFeatured from "@/components/ClientFeatured";

type TMDBMovie = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

function normalizeBase(raw: string) {
  return raw.replace(/\/+$/, "").replace(/\/search$/i, "");
}

async function fetchTMDB(path: string) {
  const raw = (process.env.SEARCH_ENDPOINT || "https://api.themoviedb.org/3").trim();
  const base = normalizeBase(raw);
  const bearer = process.env.TMDB_BEARER;
  if (!bearer) throw new Error("TMDB_BEARER not configured");
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { accept: "application/json", Authorization: `Bearer ${bearer}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`TMDB ${path} failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as { results: TMDBMovie[] };
}

export default async function Page() {
  const [popularMovies, topMovies, popularTv, topTv] = await Promise.all([
    fetchTMDB("/movie/popular?language=en-US&page=1").then((r) => r.results ?? []),
    fetchTMDB("/movie/top_rated?language=en-US&page=1").then((r) => r.results ?? []),
    fetchTMDB("/tv/popular?language=en-US&page=1").then((r) => r.results ?? []),
    fetchTMDB("/tv/top_rated?language=en-US&page=1").then((r) => r.results ?? []),
  ]);

  return (
    <ClientFeatured
      popularMovies={popularMovies}
      topMovies={topMovies}
      popularTv={popularTv}
      topTv={topTv}
    />
  );
}