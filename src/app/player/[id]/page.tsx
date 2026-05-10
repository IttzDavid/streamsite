import Link from "next/link";
import { buildEmbedUrl, getEmbedBase } from "@/lib/embed";

type Params = { id: string } | Promise<{ id: string }>;

type Search = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined, fallback: string) {
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

export default async function PlayerPage(props: { params: Params; searchParams?: Search }) {
  const { id } = await props.params;
  const searchParams = (await props.searchParams) || {};
  const type = String(searchParams["type"] || "movie").toLowerCase() === "tv" ? "tv" : "movie";
  const season = Number.parseInt(firstValue(searchParams["season"] ?? searchParams["s"], "1"), 10) || 1;
  const episode = Number.parseInt(firstValue(searchParams["episode"] ?? searchParams["e"], "1"), 10) || 1;
  const embedBase = getEmbedBase();

  const iframeSrc = buildEmbedUrl({
    base: embedBase,
    type,
    id: String(id),
    season,
    episode,
    query: { ds_lang: "en" },
  });
  const embedHost = embedBase.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  const upstreamLabel = type === "tv" ? `S${season}E${episode}` : "Movie";

  return (
    <main className="container title-page">
      <div className="title-hero-shell">
        <div className="title-hero">
          <section className="title-hero-info">
            <header className="title-head">
              <h1 className="title-title">On-site Player</h1>
              <p className="title-tagline">
                TMDB ID <strong>{id}</strong> · {upstreamLabel} · {embedHost}
              </p>
            </header>

            <div className="meta-row">
              <div className="meta-item">Type: <strong>{type.toUpperCase()}</strong></div>
              <div className="meta-item">Season: <strong>{type === "tv" ? season : "—"}</strong></div>
              <div className="meta-item">Episode: <strong>{type === "tv" ? episode : "—"}</strong></div>
            </div>

            <div className="title-actions">
              <div className="actions-primary">
                <Link href={`/title/${encodeURIComponent(String(id))}?type=${type}`} className="btn lg ghost">
                  Back to title
                </Link>
                <Link href={iframeSrc} target="_blank" rel="noopener noreferrer" className="btn lg primary">
                  Open upstream
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="section">
        <div className="player-wrap">
          <iframe
            src={iframeSrc}
            title={`Player for ${id}`}
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </main>
  );
}