"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function WatchPage(
  props: { params: { id: string } } // <-- treat params as synchronous in client component
) {
  const { params } = props;
  const id = params.id;

  const search = useSearchParams();
  const type = (search.get("type") || "movie").toLowerCase(); // "movie" or "tv"
  const external = search.get("external") === "1";

  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchEmbed = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/movies?tmdb=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => res.statusText);
          throw new Error(`Upstream failed: ${res.status} ${txt}`);
        }
        const body = await res.text();
        if (!mounted) return;

        if (external) {
          const base = (process.env.MOVIE_ENDPOINT || "").replace(/\/+$/, "");
          const upstream = `${base}/embed/movie/${encodeURIComponent(id)}`;
          if (!base) throw new Error("NEXT_PUBLIC_MOVIE_ENDPOINT is not configured");
          window.open(upstream, "_blank", "noopener,noreferrer");
        } else {
          setHtml(body);
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchEmbed();
    return () => {
      mounted = false;
    };
  }, [id, type, external]);

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
      <h1>Watch</h1>
      {loading && <p>Loading player…</p>}
      {error && <pre style={{ color: "crimson" }}>{String(error)}</pre>}
      {!loading && !error && html && <div dangerouslySetInnerHTML={{ __html: html }} />}
    </main>
  );
}