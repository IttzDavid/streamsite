import { NextRequest, NextResponse } from "next/server";

function base(raw?: string) {
  return (raw || "https://api.themoviedb.org/3").replace(/\/+$/, "");
}

type TMDBEpisode = {
  id: number;
  name: string;
  overview?: string;
  episode_number: number;
  still_path?: string | null;
  runtime?: number | null;
  air_date?: string | null;
};

type TMDBSeasonResponse = {
  name?: string;
  season_number?: number;
  episodes?: TMDBEpisode[];
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string; season: string }> }
) {
  const { id, season } = await context.params;

  const bearer = process.env.TMDB_BEARER;
  if (!bearer) {
    return NextResponse.json({ error: "TMDB_BEARER not set" }, { status: 500 });
  }

  const url = `${base(process.env.SEARCH_ENDPOINT)}/tv/${encodeURIComponent(id)}/season/${encodeURIComponent(
    season
  )}?language=en-US`;

  const res = await fetch(url, {
    headers: { accept: "application/json", Authorization: `Bearer ${bearer}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data: TMDBSeasonResponse = await res.json();

  const episodes: TMDBEpisode[] = Array.isArray(data.episodes) ? data.episodes : [];

  return NextResponse.json({
    name: data.name,
    season_number: data.season_number,
    episodes: episodes.map((e) => ({
      id: e.id,
      name: e.name,
      overview: e.overview,
      episode_number: e.episode_number,
      still_path: e.still_path,
      runtime: e.runtime,
      air_date: e.air_date,
    })),
  });
}