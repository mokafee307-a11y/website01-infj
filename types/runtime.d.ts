declare module "three";

declare module "cloudflare:workers" {
  // Cloudflare injects bindings at runtime and the starter does not ship its type package.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const env: Record<string, any>;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

// Minimal ambient bridge for the Cloudflare runtime type expected by the starter worker.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D1Database = any;
