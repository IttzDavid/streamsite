export type TMDBGenre = { id: number; name: string };

export type TMDBCastItem = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
};

export type TMDBCrewItem = {
  id: number;
  name: string;
  job?: string;
  department?: string;
  profile_path?: string | null;
};

export type TMDBVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
  published_at?: string;
};

export type TMDBMovieShort = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
};

export type TMDBDetails = {
  id?: number;
  title?: string;
  name?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  overview?: string;
  tagline?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genres?: TMDBGenre[];
  runtime?: number;
  imdb_id?: string | null;
  homepage?: string | null;
  production_companies?: { id: number; name: string; logo_path?: string | null }[];
  credits?: { cast?: TMDBCastItem[]; crew?: TMDBCrewItem[] };
  videos?: { results?: TMDBVideo[] };
  similar?: { results?: TMDBMovieShort[] };
  release_dates?: { results?: Array<{ iso_3166_1: string; release_dates: Array<{ certification?: string; release_date?: string }> }> };
};

function normalizeBase(raw?: string) {
  const fallback = "https://api.themoviedb.org/3";
  const v = (raw || fallback).trim();
  return v.replace(/\/+$/, "");
}

/**
 * Fetch TMDB details for a movie or tv by id.
 * - Uses SEARCH_ENDPOINT env var if present, otherwise the official TMDB base.
 * - Requires TMDB_BEARER env var (server-only).
 * - Appends common sub-resources (credits, videos, similar, release_dates).
 */
export async function fetchTmdbDetails(id: string, type: "movie" | "tv"): Promise<TMDBDetails> {
  const base = normalizeBase(process.env.SEARCH_ENDPOINT);
  const bearer = process.env.TMDB_BEARER;
  if (!bearer) throw new Error("TMDB_BEARER env var is not configured");

  const append = ["credits", "videos", "similar", "release_dates"].join(",");
  const url = `${base}/${type}/${encodeURIComponent(id)}?language=en-US&append_to_response=${encodeURIComponent(append)}`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${bearer}`,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`TMDB fetch failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as TMDBDetails;
}