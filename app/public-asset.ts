/** Relative URLs support both a GitHub Pages project path and a custom domain. */
export function publicAsset(path: string) {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE ?? "/";
  return `${base}${path.replace(/^\/+/, "")}`;
}
