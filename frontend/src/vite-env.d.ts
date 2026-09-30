/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAW_API_URL?: string;
  readonly VITE_USE_MOCK_PAW?: string;
  readonly VITE_PAW_VOICE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' { const src: string; export default src; }
