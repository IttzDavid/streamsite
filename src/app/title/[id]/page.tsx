import React from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchTmdbDetails, TMDBDetails, TMDBGenre, TMDBCastItem, TMDBVideo, TMDBMovieShort } from "@/lib/tmdb";

type Props = {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { type?: string } | Promise<{ type?: string }>;
};

function formatRuntime(mins?: number) {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const TMDB_IMG = "https://image.tmdb.org/t/p/";

export default async function Page(props: Props) {
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
      <main className="container title-page">
        <div className="title-hero-shell">
          <div className="title-hero">
            <div>
              <h1>Error</h1>
              <pre>{msg}</pre>
              <p><Link href="/">Back home</Link></p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const title = details.title ?? details.name ?? details.original_name ?? "Untitled";
  const date = details.release_date ?? details.first_air_date ?? "";
  const year = date ? ` (${date.slice(0, 4)})` : "";
  const poster = details.poster_path ? `${TMDB_IMG}w500${details.poster_path}` : null;
  const overview = details.overview ?? "";

  const movieBase = (process.env.MOVIE_ENDPOINT || process.env.NEXT_PUBLIC_MOVIE_ENDPOINT || "").replace(/\/+$/, "");
  const upstreamWatchUrl = movieBase ? `${movieBase}/embed/movie/${encodeURIComponent(id)}` : "";

  const directors = (details.credits?.crew ?? []).filter((c) => c.job === "Director").map((d) => d.name);
  const castList: TMDBCastItem[] = (details.credits?.cast ?? []).slice(0, 12);
  const trailer = (details.videos?.results ?? []).find(
    (v: TMDBVideo) => v.site === "YouTube" && /Trailer|Teaser/i.test(v.type)
  );
  const runtimeStr = formatRuntime(details.runtime);
  const similar: TMDBMovieShort[] = (details.similar?.results ?? []).slice(0, 12);

  let certification = "";
  if (details.release_dates?.results) {
    const us = details.release_dates.results.find((r) => r.iso_3166_1 === "US") ?? details.release_dates.results[0];
    const rel = us?.release_dates?.[0];
    if (rel?.certification) certification = rel.certification;
  }

  // Ambient trailer only behind the hero
  const ambientUrl = trailer
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3`
    : null;

  return (
    <main className="container title-page">
      <div className="title-hero-shell">
        {ambientUrl && (
          <div className="hero-ambient" aria-hidden="true">
            <div className="ambient-media">
              <iframe
                src={ambientUrl}
                title="Ambient trailer"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="ambient-dim" />
            <div className="ambient-fade" />
          </div>
        )}

        {/* HERO */}
        <div className="title-hero">
          <aside className="title-poster">
            <div className="promo-card">
              {poster ? (
                <Image src={poster} alt={title} width={500} height={750} className="promo-media" unoptimized />
              ) : (
                <div className="poster-placeholder" />
              )}
            </div>
          </aside>

          <section className="title-hero-info">
            <header className="title-head">
              <h1 className="title-title">
                {title} <span className="title-year">{year}</span>
              </h1>
              {details.tagline ? <p className="title-tagline">{details.tagline}</p> : null}
            </header>

            <div className="meta-row">
              <div className="meta-item">Runtime: <strong>{runtimeStr}</strong></div>
              <div className="meta-item">Rating: <strong>{details.vote_average ?? "N/A"}</strong></div>
              <div className="meta-item">Votes: <strong>{details.vote_count ?? 0}</strong></div>
              <div className="meta-item">Cert: <strong>{certification || "—"}</strong></div>
              <div className="meta-item">Popularity: <strong>{Math.round(details.popularity ?? 0)}</strong></div>
            </div>

            {details.genres && details.genres.length > 0 && (
              <section className="section">
                <h3 className="section-title">Genres</h3>
                <div className="tag-row">
                  {details.genres.map((g: TMDBGenre) => (
                    <span key={g.id} className="tag">{g.name}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Actions next to poster */}
            <div className="title-actions">
              <div className="actions-primary">
                <Link href={`/`} className="btn lg ghost">Back</Link>
                {upstreamWatchUrl ? (
                  <a href={upstreamWatchUrl} target="_blank" rel="noopener noreferrer" className="btn lg primary">
                    Watch on Vidsrc
                  </a>
                ) : (
                  <Link href={`/watch/${id}?type=${type}`} className="btn lg primary">Open Watch Page</Link>
                )}
              </div>
              <div className="actions-secondary">
                {trailer && (
                  <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer" className="btn sm ghost">
                    Trailer
                  </a>
                )}
                {details.homepage && <a href={details.homepage} target="_blank" rel="noopener noreferrer" className="btn sm ghost">Official Site</a>}
                {details.imdb_id && <a href={`https://www.imdb.com/title/${details.imdb_id}`} target="_blank" rel="noopener noreferrer" className="btn sm ghost">IMDB</a>}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* BODY */}
      <section className="title-body">
        <section className="section">
          <h3 className="section-title">Overview</h3>
          <p className="overview-text">{overview}</p>
        </section>

        {directors.length > 0 && (
          <section className="section">
            <h3 className="section-title">Director{directors.length > 1 ? "s" : ""}</h3>
            <div className="meta-row">
              <div className="meta-item"><strong>{directors.join(", ")}</strong></div>
            </div>
          </section>
        )}

        {castList.length > 0 && (
          <details className="section disclosure">
            <summary className="disclosure-summary">
              Top Cast <span className="count">({castList.length})</span>
            </summary>
            <div className="cast-grid">
              {castList.map((c) => (
                <Link key={c.id} href={`/person/${c.id}`} className="cast-card">
                  <img
                    src={c.profile_path ? `${TMDB_IMG}w185${c.profile_path}` : "/placeholder-person.png"}
                    alt={c.name}
                    className="cast-photo"
                  />
                  <div className="cast-meta">
                    <div className="cast-name">{c.name}</div>
                    <div className="cast-role">{c.character}</div>
                  </div>
                </Link>
              ))}
            </div>
          </details>
        )}

        {similar.length > 0 && (
          <section className="section">
            <h3 className="section-title">Similar</h3>
            <div className="similar-grid">
              {similar.map((s) => {
                const sPoster = s.poster_path ? `${TMDB_IMG}w342${s.poster_path}` : "";
                const sTitle = s.title ?? s.name ?? "Untitled";
                const sYear = (s.release_date ?? s.first_air_date ?? "").slice(0, 4);
                return (
                  <Link key={s.id} href={`/title/${s.id}?type=${type}`} className="similar-card">
                    {sPoster ? (
                      <img src={sPoster} alt={sTitle} className="similar-poster" />
                    ) : (
                      <div className="poster-placeholder similar-placeholder" />
                    )}
                    <div className="similar-meta">
                      <strong className="similar-title">{sTitle}</strong>
                      <div className="similar-year">{sYear}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}