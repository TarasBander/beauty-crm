/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL prefixed to every API path in shared/api/http.ts. Unset,
   * it stays `/api` — same-origin, relying on vite.config.ts's dev
   * proxy or a production reverse proxy. Set it (e.g. via a `.env.production`
   * or the build environment) to point the built app at a different
   * origin, such as a separately-hosted backend. */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
