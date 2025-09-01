"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

type ClientProps = {
  popular: TMDBMovie[];
  topRated: TMDBMovie[];
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

export default function ClientFeatured({ popular, topRated }: ClientProps) {
  const router = useRouter();

  const [tab, setTab] = useState<"movies" | "tv">("movies");
  const [query, setQuery] = useState("");
  const [minRating, setMinRating] = useState<number | "any">("any");

  const mapMovie = (m: TMDBMovie): Item => ({
    id: String(m.id),
    title: m.title ?? m.name ?? "Untitled",
    year: Number((m.release_date ?? m.first_air_date ?? "0").slice(0, 4)) || 0,
    rating: Math.round((m.vote_average ?? 0) * 10) / 10,
    type: "movie",
    poster: m.poster_path ? `${IMG}${m.poster_path}` : "",
  });

  const popularList = useMemo(() => popular.map(mapMovie), [popular]);
  const topRatedList = useMemo(() => topRated.map(mapMovie), [topRated]);

  function applyFilters(list: Item[]) {
    return list.filter((item) => {
      if (minRating !== "any" && item.rating < minRating) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!item.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  const filteredPopular = useMemo(() => applyFilters(popularList), [popularList, query, minRating]);
  const filteredTopRated = useMemo(() => applyFilters(topRatedList), [topRatedList, query, minRating]);

  const heroItem = popularList[0] ?? topRatedList[0];

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
          <button className={`tab ${tab === "movies" ? "active" : ""}`} onClick={() => setTab("movies")}>
            Movies
          </button>
          <button className={`tab ${tab === "tv" ? "active" : ""}`} onClick={() => setTab("tv")}>
            TV
          </button>
        </nav>

        <div className="controls">
          <div className="search">
            <input
              placeholder={`Search ${tab === "movies" ? "movies" : "TV shows"}...`}
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

            <div className="filters">
              <div className="filter">
                <label>Min rating</label>
                <select value={minRating} onChange={(e) => setMinRating(e.target.value === "any" ? "any" : Number(e.target.value))}>
                  <option value="any">Any</option>
                  <option value="9">9+</option>
                  <option value="8">8+</option>
                  <option value="7">7+</option>
                </select>
              </div>
            </div>
          </div>

          <div className="hero-right" aria-hidden>
            {heroItem && (
              <div
                className="promo-card"
                role="link"
                tabIndex={0}
                aria-label={`Open details for ${heroItem.title}`}
                onClick={() => router.push(`/title/${heroItem.id}?type=${heroItem.type}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/title/${heroItem.id}?type=${heroItem.type}`);
                  }
                }}
              >
                {heroItem.poster ? (
                  <img className="promo-media" src={heroItem.poster} alt={heroItem.title} />
                ) : (
                  <div className="poster-placeholder" />
                )}
                <div className="promo-meta">
                  <div className="chip">
                    <span>⭐ {heroItem.rating || "—"}</span>
                    <span>•</span>
                    <span>{heroItem.year || "—"}</span>
                  </div>
                  <h3 className="promo-title">{heroItem.title}</h3>
                  <div className="promo-sub">
                    <span className="muted">Click to open details</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid-section" aria-live="polite">
        <div className="grid-head">
          <h2>Popular</h2>
          <p className="muted">{filteredPopular.length} results</p>
        </div>

        <div className="card-grid" role="list">
          {filteredPopular.map((it) => (
            <Link key={`popular-${it.id}`} href={`/title/${it.id}?type=${it.type}`} className="card-link" role="listitem" aria-label={`Open details for ${it.title}`}>
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
          {filteredPopular.length === 0 && (
            <div className="empty">
              <h3>No results</h3>
              <p>Try adjusting filters or search terms.</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid-section" style={{ marginTop: 14 }}>
        <div className="grid-head">
          <h2>Top Rated</h2>
          <p className="muted">{filteredTopRated.length} results</p>
        </div>

        <div className="card-grid" role="list">
          {filteredTopRated.map((it) => (
            <Link key={`top-${it.id}`} href={`/title/${it.id}?type=${it.type}`} className="card-link" role="listitem" aria-label={`Open details for ${it.title}`}>
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
          {filteredTopRated.length === 0 && (
            <div className="empty">
              <h3>No results</h3>
              <p>Try adjusting filters or search terms.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}