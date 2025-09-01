import React from "react";
import Image from "next/image";

type Props = {
  params: { id: string } | Promise<{ id: string }>;

  searchParams?: { type?: string } | Promise<{ type?: string }>;
};

type TMDBGenre = { id: number; name: string };
type TMDBDetails = {
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
};

async function fetchTmdbDetails(id: string, type: "movie" | "tv"): Promise<TMDBDetails> {
  const raw = (process.env.SEARCH_ENDPOINT || "").replace(/\/+$/, "");
  const base = raw.replace(/\/search$/i, "");
  if (!base) throw new Error("SEARCH_ENDPOINT not configured");
  const bearer = process.env.TMDB_BEARER;
  if (!bearer) throw new Error("TMDB_BEARER not configured");

  const url = `${base}/${type}/${encodeURIComponent(id)}?language=en-US`;
  const res = await fetch(url, {
    headers: { accept: "application/json", Authorization: `Bearer ${bearer}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`TMDB fetch failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as TMDBDetails;
}

export default async function Page(props: Props) {
  // unwrap possible Promise<{ id: string }> and possible Promise<{ type?: string }>
  const params = await props.params;
  const searchParams = await (props.searchParams ?? {});

  const id = params.id;
  const type = (searchParams?.type || "movie").toLowerCase() === "tv" ? "tv" : "movie";

  let details: TMDBDetails | null = null;
  try {
    details = await fetchTmdbDetails(id, type as "movie" | "tv");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <main style={{ padding: 24 }}>
        <h1>Error</h1>
        <pre>{msg}</pre>
      </main>
    );
  }

  const title = details.title ?? details.name ?? details.original_name ?? "Untitled";
  const date = details.release_date ?? details.first_air_date ?? "";
  const year = date ? ` (${date.slice(0, 4)})` : "";
  const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null;
  const overview = details.overview ?? "";

  // build absolute upstream watch URL (use MOVIE_ENDPOINT or NEXT_PUBLIC_MOVIE_ENDPOINT)
  const movieBase = (process.env.MOVIE_ENDPOINT || process.env.NEXT_PUBLIC_MOVIE_ENDPOINT || "").replace(/\/+$/, "");
  const upstreamWatchUrl = movieBase ? `${movieBase}/embed/movie/${encodeURIComponent(id)}` : "";

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: "0 0 300px" }}>
          {poster ? (
            <Image src={poster} alt={title} width={300} height={450} style={{ borderRadius: 8 }} unoptimized />
          ) : (
            <div style={{ width: 300, height: 450, background: "#eee", borderRadius: 8 }} />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>
            {title}
            {year}
          </h1>
          <p style={{ color: "#666" }}>{details.tagline ?? ""}</p>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <a
              href={`/watch/${id}?type=${type}`}
              style={{ padding: "10px 14px", background: "#0b5cff", color: "#fff", borderRadius: 8, textDecoration: "none" }}
            >
              Play Inline
            </a>

            {upstreamWatchUrl ? (
              <a
                href={upstreamWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "10px 14px", background: "#111", color: "#fff", borderRadius: 8, textDecoration: "none" }}
              >
                Open on Vidsrc
              </a>
            ) : (
              <a
                href={`/watch/${id}?type=${type}&external=1`}
                style={{ padding: "10px 14px", background: "#111", color: "#fff", borderRadius: 8, textDecoration: "none" }}
              >
                Open Watch Page
              </a>
            )}
          </div>

          <section style={{ marginTop: 18 }}>
            <h3>Overview</h3>
            <p style={{ color: "#222" }}>{overview}</p>
          </section>

          <section style={{ marginTop: 12 }}>
            <div>Rating: {details.vote_average ?? "N/A"} ({details.vote_count ?? 0})</div>
            <div>Popularity: {Math.round(details.popularity ?? 0)}</div>
            {details.genres && Array.isArray(details.genres) && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {details.genres.map((g: TMDBGenre) => (
                  <span key={g.id} style={{ background: "#eef2ff", padding: "4px 8px", borderRadius: 999 }}>
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}