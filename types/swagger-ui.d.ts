/**
 * Type declarations for Swagger UI Bundle loaded via CDN
 */

interface SwaggerUIPreset {
  apis: unknown[];
}

interface SwaggerUIConfig {
  url: string;
  dom_id: string;
  presets: unknown[];
  layout: string;
  deepLinking: boolean;
  defaultModelsExpandDepth: number;
  defaultModelExpandDepth: number;
}

interface SwaggerUIBundleType {
  (config: SwaggerUIConfig): void;
  presets: SwaggerUIPreset;
}

interface SwaggerUIStandalonePresetType {
  (): unknown[];
}

declare global {
  interface Window {
    SwaggerUIBundle?: SwaggerUIBundleType;
    SwaggerUIStandalonePreset?: SwaggerUIStandalonePresetType;
  }
}

export {};
