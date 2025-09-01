import { redirect } from "next/navigation";

type Params = { id: string } | Promise<{ id: string }>;

type Search = Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;

export default async function WatchPage(props: { params: Params; searchParams?: Search }) {
  const { id } = await props.params;
  const searchParams = (await props.searchParams) || {};
  const type = String(searchParams["type"] || "movie").toLowerCase();
  const s = String(searchParams["season"] || searchParams["s"] || "1");
  const e = String(searchParams["episode"] || searchParams["e"] || "1");

  const base = (process.env.MOVIE_ENDPOINT || "").replace(/\/+$/, "");
  if (!base) redirect(`/title/${encodeURIComponent(String(id))}?type=${encodeURIComponent(type)}`);

  const qs = "?ds_lang=en";
  const upstream =
    type === "tv"
      ? `${base}/embed/tv/${encodeURIComponent(String(id))}/${encodeURIComponent(s)}/${encodeURIComponent(e)}${qs}`
      : `${base}/embed/movie/${encodeURIComponent(String(id))}${qs}`;

  redirect(upstream);
}