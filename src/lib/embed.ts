export type EmbedType = "movie" | "tv";

const FALLBACK_EMBED_BASES = ["https://vidsrc-embed.ru", "https://vidsrc-embed.su", "https://vidsrcme.su", "https://vsrc.su"];

function normalizeBase(raw?: string) {
  const value = (raw || FALLBACK_EMBED_BASES[0]).trim();
  return value.replace(/\/+$/, "");
}

export function getEmbedBase() {
  return normalizeBase(process.env.MOVIE_ENDPOINT);
}

export function buildEmbedUrl({
  base = getEmbedBase(),
  type,
  id,
  season = 1,
  episode = 1,
  query,
}: {
  base?: string;
  type: EmbedType;
  id: string;
  season?: number | string;
  episode?: number | string;
  query?: Record<string, string | number | undefined>;
}) {
  const normalizedBase = normalizeBase(base);
  const path =
    type === "tv"
      ? `/embed/tv/${encodeURIComponent(id)}/${encodeURIComponent(String(season))}/${encodeURIComponent(String(episode))}`
      : `/embed/movie/${encodeURIComponent(id)}`;

  const url = new URL(`${normalizedBase}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}