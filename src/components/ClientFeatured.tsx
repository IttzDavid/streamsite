"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* Types */
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

type Props = {
  popularMovies: TMDBMovie[];
  topMovies: TMDBMovie[];
  popularTv: TMDBMovie[];
  topTv: TMDBMovie[];
};

type Item = {
  id: string;
  title: string;
  year: number;
  rating: number;
  type: "movie" | "tv";
  poster: string;
};

const IMG = "https://image.tmdb.org/t/p/w500";

function toItem(m: TMDBMovie, type: "movie" | "tv"): Item {
  return {
    id: String(m.id),
    title: (type === "movie" ? m.title : m.name) || m.title || m.name || "Untitled",
    year: Number((m.release_date ?? m.first_air_date ?? "0").slice(0, 4)) || 0,
    rating: Math.round((m.vote_average ?? 0) * 10) / 10,
    type,
    poster: m.poster_path ? `${IMG}${m.poster_path}` : "",
  };
}

export default function ClientFeatured({ popularMovies, topMovies, popularTv, topTv }: Props) {
  const [tab, setTab] = useState<"movie" | "tv">("movie");
  const [query, setQuery] = useState("");
  const [minRating, setMinRating] = useState<number | "any">("any");
  const [searchResults, setSearchResults] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);

  const popularList = useMemo(
    () => (tab === "movie" ? popularMovies.map((m) => toItem(m, "movie")) : popularTv.map((m) => toItem(m, "tv"))),
    [tab, popularMovies, popularTv]
  );
  const topList = useMemo(
    () => (tab === "movie" ? topMovies.map((m) => toItem(m, "movie")) : topTv.map((m) => toItem(m, "tv"))),
    [tab, topMovies, topTv]
  );

  // Debounced API search (typed by active tab)
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?type=${tab}&q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        const list: TMDBMovie[] = data.results ?? [];
        const items = list.map((m) => toItem(m, tab));
        setSearchResults(items);
      } catch {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, tab]);

  function applyFilters(list: Item[]) {
    return list.filter((item) => (minRating === "any" ? true : item.rating >= minRating));
  }

  const results = useMemo(
    () => (searchResults ? applyFilters(searchResults) : []),
    [searchResults, minRating]
  );
  const quickPicks = useMemo(() => applyFilters(popularList).slice(0, 6), [popularList, minRating]);

  const heroItem = popularList[0] ?? topList[0];

  return (
    <main className="container page">
      <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden>
            <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
              <defs>
                <linearGradient id="g" x1="0" x2="1">
                  <stop offset="0" stopColor="#7c5cff" />
                  <stop offset="1" stopColor="#00d4ff" />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="8" fill="url(#g)" />
              <path d="M11 25V11l10 7-10 7z" fill="#fff" opacity="0.95" />
            </svg>
          </div>
          <div className="name">
            <span className="title">Streamline</span>
            <span className="subtitle">curated • cinematic • now</span>
          </div>
        </div>

        <nav className="topnav" aria-label="Primary">
          <button className={`tab ${tab === "movie" ? "active" : ""}`} onClick={() => setTab("movie")}>
            Movies
          </button>
          <button className={`tab ${tab === "tv" ? "active" : ""}`} onClick={() => setTab("tv")}>
            TV
          </button>
        </nav>

        <div className="controls">
          <div className="search">
            <input
              placeholder={`Search ${tab === "movie" ? "movies" : "TV shows"}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
            />
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-grid">
          <div className="hero-left">
            <h1>Watch cinematic stories that move you.</h1>
            <p className="lead">Sleek curation. Personalized picks. Stream anytime, anywhere.</p>
            <p className="slogan">Stream smarter • Curated daily • Fresh picks for you</p>

            <div className="filters">
              <div className="filter">
                <label>Min rating</label>
                <select
                  className="select rating-select"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value === "any" ? "any" : Number(e.target.value))}
                >
                  <option value="any">Any</option>
                  <option value="9">9+</option>
                  <option value="8">8+</option>
                  <option value="7">7+</option>
                </select>
              </div>
            </div>

            {/* Optional: small hero item chip under copy */}
            {heroItem && (
              <div className="mini-hero">
                {heroItem.poster ? <img src={heroItem.poster} alt="" /> : <div className="poster-placeholder" />}
                <div className="mini-meta">
                  <strong className="mini-title">{heroItem.title}</strong>
                  <div className="mini-sub">
                    <span>{heroItem.year || "—"}</span>
                    <span>•</span>
                    <span>⭐ {heroItem.rating || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side: Search results panel (replaces big poster) */}
          <aside className="hero-right">
            <div className="search-panel">
              <div className="panel-head">
                <h3>Search results</h3>
                <span className="muted">
                  {query.trim().length === 0
                    ? "Type to search"
                    : loading
                    ? "Searching…"
                    : `${results.length} match${results.length === 1 ? "" : "es"}`}
                </span>
              </div>

              <div className="results-list" role="list">
                {query.trim().length === 0 && quickPicks.length > 0 && (
                  <div className="empty">Quick picks</div>
                )}

                {(query.trim().length === 0 ? quickPicks : results).map((it) => (
                  <Link
                    key={`res-${it.id}`}
                    href={`/title/${it.id}?type=${it.type}`}
                    className="result-row"
                    role="listitem"
                    aria-label={`Open ${it.title}`}
                  >
                    <div className="thumb">
                      {it.poster ? <img src={it.poster} alt="" /> : <div className="poster-placeholder" />}
                    </div>
                    <div className="info">
                      <div className="top">
                        <strong className="title">{it.title}</strong>
                        <span className="chip">{Number(it.rating).toFixed(1)}</span>
                      </div>
                      <div className="sub">
                        <span className="muted">{it.year || "—"}</span>
                        <span className="dot">•</span>
                        <span className="muted">{it.type === "movie" ? "Movie" : "TV"}</span>
                      </div>
                    </div>
                  </Link>
                ))}

                {query.trim().length > 0 && !loading && results.length === 0 && (
                  <div className="empty">No results</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Always show the main sections; search no longer replaces them */}
      <section className="grid-section">
        <div className="grid-head">
          <h2>Popular {tab === "movie" ? "Movies" : "TV Shows"}</h2>
          <p className="muted">{applyFilters(popularList).length} results</p>
        </div>
        <div className="card-grid" role="list">
          {applyFilters(popularList).map((it) => (
            <Link key={`pop-${it.id}`} href={`/title/${it.id}?type=${it.type}`} className="card-link" role="listitem">
              <article className="card" tabIndex={0}>
                <div className="poster">
                  {it.poster ? <img src={it.poster} alt={`${it.title} poster`} /> : <div className="poster-placeholder" />}
                  <div className="badge">{Number(it.rating).toFixed(1)}</div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{it.title}</h3>
                  <div className="meta">
                    <span>{it.year || "—"}</span>
                    <span>•</span>
                    <span>⭐ {it.rating || "—"}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid-section" style={{ marginTop: 14 }}>
        <div className="grid-head">
          <h2>Top Rated {tab === "movie" ? "Movies" : "TV Shows"}</h2>
          <p className="muted">{applyFilters(topList).length} results</p>
        </div>
        <div className="card-grid" role="list">
          {applyFilters(topList).map((it) => (
            <Link key={`top-${it.id}`} href={`/title/${it.id}?type=${it.type}`} className="card-link" role="listitem">
              <article className="card" tabIndex={0}>
                <div className="poster">
                  {it.poster ? <img src={it.poster} alt={`${it.title} poster`} /> : <div className="poster-placeholder" />}
                  <div className="badge">{Number(it.rating).toFixed(1)}</div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{it.title}</h3>
                  <div className="meta">
                    <span>{it.year || "—"}</span>
                    <span>•</span>
                    <span>⭐ {it.rating || "—"}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}