"use client";

import React, { useEffect, useMemo, useState } from "react";

type SeasonLite = { season_number: number; episode_count?: number; name?: string };
type EpisodeLite = {
  id: number;
  name: string;
  overview?: string;
  episode_number: number;
  still_path?: string | null;
  runtime?: number | null;
  air_date?: string | null;
};

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

export default function EpisodePicker({
  tvId,
  seasons,
  initialSeason,
  movieBase,
}: {
  tvId: string;
  seasons: SeasonLite[];
  initialSeason?: number;
  movieBase?: string;
}) {
  const seasonOptions = useMemo(
    () => seasons.filter((s) => (s.episode_count ?? 0) > 0).sort((a, b) => (a.season_number || 0) - (b.season_number || 0)),
    [seasons]
  );

  const [season, setSeason] = useState<number>(initialSeason ?? (seasonOptions[0]?.season_number ?? 1));
  const [episodes, setEpisodes] = useState<EpisodeLite[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tv/${encodeURIComponent(tvId)}/season/${encodeURIComponent(String(season))}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as { episodes?: EpisodeLite[] };
        if (alive) setEpisodes(data.episodes || []);
      } catch {
        if (alive) setEpisodes([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [tvId, season]);

  const upstreamBase = (movieBase || "").replace(/\/+$/, "");

  return (
    <section className="section">
      <h3 className="section-title">Episodes</h3>

      <div className="season-bar">
        {seasonOptions.map((s) => (
          <button
            key={s.season_number}
            className={`season-chip ${season === s.season_number ? "active" : ""}`}
            onClick={() => setSeason(s.season_number)}
          >
            S{s.season_number}
          </button>
        ))}
      </div>

      <div className="episodes-grid" aria-busy={loading}>
        {loading && <div className="empty muted">Loading…</div>}
        {!loading && (episodes?.length ?? 0) === 0 && <div className="empty muted">No episodes</div>}

        {!loading &&
          (episodes || []).map((ep) => {
            const still = ep.still_path ? `${TMDB_IMG}${ep.still_path}` : "";
            const directHref = `${upstreamBase}/embed/tv/${encodeURIComponent(String(tvId))}/${encodeURIComponent(
              String(season)
            )}/${encodeURIComponent(String(ep.episode_number))}?ds_lang=en`;

            return (
              <article key={ep.id || `${tvId}-${season}-${ep.episode_number}`} className="episode-card">
                <a
                  href={directHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="episode-link"
                  aria-label={`Play S${season}E${ep.episode_number} ${ep.name}`}
                >
                  <div className="episode-media">
                    {still ? <img src={still} alt="" loading="lazy" /> : <div className="episode-fallback" aria-hidden />}
                    <div className="episode-badge">S{season} • E{ep.episode_number}</div>
                  </div>
                  <div className="episode-body">
                    <strong className="episode-title">{ep.name || `Episode ${ep.episode_number}`}</strong>
                    <div className="episode-sub muted">{ep.runtime ? `${ep.runtime}m` : ep.air_date || ""}</div>
                    {ep.overview ? <p className="episode-overview">{ep.overview}</p> : null}
                  </div>
                </a>
              </article>
            );
          })}
      </div>
    </section>
  );
}