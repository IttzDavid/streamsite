"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

type MediaType = "movie" | "tv";

type ResultItem = {
    id: string | number;
    title?: string;
    name?: string; // tv shows often use `name`
    original_name?: string;
    overview?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    media_type?: MediaType;
    vote_average?: number;
    vote_count?: number;
    popularity?: number;
    genre_ids?: number[];
};

export default function Page() {
    const [query, setQuery] = useState("");
    const [type, setType] = useState<MediaType>("movie");
    const [results, setResults] = useState<ResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const debounceRef = useRef<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // stable builders to satisfy hook deps
    const buildUrl = useCallback((q: string, t: MediaType) => `/api/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(t)}`, []);

    const fetchResults = useCallback(
        async (q: string, t: MediaType) => {
            if (!q.trim()) return;
            if (abortRef.current) {
                abortRef.current.abort();
            }
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                setLoading(true);
                setError(null);
                const res = await fetch(buildUrl(q, t), { signal: controller.signal });
                if (!res.ok) {
                    const txt = await res.text().catch(() => "unknown error");
                    throw new Error(txt || "Search failed");
                }
                const data = (await res.json()) as { results?: ResultItem[] } | ResultItem[];
                const items: ResultItem[] = Array.isArray(data) ? data : data.results ?? [];
                setResults(items);
            } catch (err: unknown) {
                // detect abort without using `any`
                if (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError") {
                    return;
                }
                setError(err instanceof Error ? err.message : String(err));
                setResults([]);
            } finally {
                setLoading(false);
            }
        },
        [buildUrl]
    );

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setError(null);
            setLoading(false);
            return;
        }

        // debounce
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            fetchResults(query, type);
        }, 400);

        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
            if (abortRef.current) {
                abortRef.current.abort();
            }
        };
    }, [query, type, fetchResults]);

    const onSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        fetchResults(query, type);
    };

    const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

    return (
        <main style={styles.container}>
            <h1 style={styles.title}>Search Movies & TV</h1>

            <form onSubmit={onSubmit} style={styles.form} aria-label="search-form">
                <div style={styles.row}>
                    <input
                        aria-label="search query"
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search ${type === "movie" ? "movies" : "TV shows"}...`}
                        style={styles.input}
                    />

                    <div style={styles.selectWrap}>
                        <label htmlFor="media-type" style={styles.srOnly}>
                            Media type
                        </label>
                        <select
                            id="media-type"
                            value={type}
                            onChange={(e) => setType(e.target.value as MediaType)}
                            style={styles.select}
                        >
                            <option value="movie">Movies</option>
                            <option value="tv">TV Shows</option>
                        </select>
                    </div>

                    <button type="submit" style={styles.button} aria-label="Search">
                        Search
                    </button>
                </div>
            </form>

            <div style={styles.resultsWrap}>
                {loading && <p style={styles.info}>Loading…</p>}
                {error && <p style={{ ...styles.info, color: "#b00020" }}>{error}</p>}
                {!loading && !error && !results.length && query.trim() && <p style={styles.info}>No results found.</p>}

                <ul style={styles.list}>
                    {results.map((r) => {
                        const title = r.title ?? r.name ?? r.original_name ?? "Untitled";
                        const date = r.release_date ?? r.first_air_date ?? "";
                        const year = date ? ` • ${date.slice(0, 4)}` : "";
                        const posterUrl =
                            r.poster_path && r.poster_path !== null
                                ? r.poster_path.startsWith("http")
                                    ? r.poster_path
                                    : `${TMDB_IMAGE_BASE}${r.poster_path}`
                                : null;

                        return (
                            <li key={r.id} style={styles.item}>
                                <Link
                                    href={`/title/${r.id}?type=${encodeURIComponent(type)}`}
                                    style={{ display: "contents" }}
                                    aria-label={`Open details for ${title}`}
                                >
                                    <div style={styles.itemLeft}>
                                        {posterUrl ? (
                                            <Image src={posterUrl} alt={title} width={92} height={138} style={{ borderRadius: 6 }} unoptimized />
                                        ) : (
                                            <div style={styles.posterPlaceholder}>No Image</div>
                                        )}
                                    </div>

                                    <div style={styles.itemRight}>
                                        <div style={styles.itemHeader}>
                                            <strong>{title}</strong>
                                            <span style={styles.meta}>
                                                {r.media_type ?? type}
                                                {year}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                            {typeof r.vote_average === "number" && (
                                                <div style={styles.badge}>
                                                    ⭐ {r.vote_average.toFixed(1)} ({r.vote_count ?? 0})
                                                </div>
                                            )}
                                            {typeof r.popularity === "number" && <div style={styles.badge}>🔥 {Math.round(r.popularity)}</div>}
                                            {r.genre_ids && r.genre_ids.length > 0 && (
                                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                    {r.genre_ids.map((g) => (
                                                        <span key={g} style={styles.genreBadge}>
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {r.overview && <p style={styles.overview}>{r.overview}</p>}
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </main>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        maxWidth: 900,
        margin: "32px auto",
        padding: "0 16px",
        fontFamily: "Inter, Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif",
    },
    title: {
        margin: "0 0 16px",
        fontSize: 28,
    },
    form: {
        marginBottom: 20,
    },
    row: {
        display: "flex",
        gap: 8,
        alignItems: "center",
    },
    input: {
        flex: 1,
        padding: "10px 12px",
        fontSize: 16,
        borderRadius: 8,
        border: "1px solid #ddd",
    },
    selectWrap: {
        minWidth: 140,
    },
    select: {
        width: "100%",
        padding: "10px 12px",
        fontSize: 15,
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        appearance: "none",
    },
    button: {
        padding: "10px 14px",
        fontSize: 15,
        borderRadius: 8,
        border: "none",
        background: "#0b5cff",
        color: "#fff",
        cursor: "pointer",
    },
    resultsWrap: {
        marginTop: 8,
    },
    info: {
        color: "#666",
        margin: "8px 0",
    },
    list: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "grid",
        gap: 12,
    },
    item: {
        display: "flex",
        gap: 12,
        padding: 12,
        borderRadius: 8,
        border: "1px solid #eee",
        alignItems: "flex-start",
    },
    itemLeft: {
        width: 92,
        flex: "0 0 92px",
    },
    poster: {
        width: 92,
        height: 138,
        objectFit: "cover",
        borderRadius: 6,
    },
    posterPlaceholder: {
        width: 92,
        height: 138,
        borderRadius: 6,
        background: "#f2f2f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#999",
        fontSize: 12,
    },
    itemRight: {
        flex: 1,
    },
    itemHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "baseline",
        marginBottom: 6,
    },
    meta: {
        color: "#666",
        fontSize: 13,
    },
    overview: {
        margin: 0,
        color: "#333",
    },
    srOnly: {
        position: "absolute",
        left: -9999,
        top: "auto",
        width: 1,
        height: 1,
        overflow: "hidden",
    },
    badge: {
        background: "#f3f4f6",
        color: "#111",
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 13,
    },
    genreBadge: {
        background: "#eef2ff",
        color: "#1e3a8a",
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 12,
    },
};