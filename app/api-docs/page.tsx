"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
/// <reference path="../types/swagger-ui.d.ts" />

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Initialize Swagger UI after scripts are loaded
    const initSwagger = (): void => {
      if (typeof window !== "undefined" && window.SwaggerUIBundle && !initialized.current) {
        initialized.current = true;
        window.SwaggerUIBundle({
          url: "/api/docs",
          dom_id: "#swagger-ui",
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset,
          ],
          layout: "StandaloneLayout",
          deepLinking: true,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
        });
      }
    };

    // Check if already loaded
    initSwagger();

    // Also try after a short delay (for script loading)
    const timer = setTimeout(initSwagger, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Swagger UI CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
      />

      {/* Swagger UI Scripts */}
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined" && window.SwaggerUIBundle && !initialized.current) {
            initialized.current = true;
            window.SwaggerUIBundle({
              url: "/api/docs",
              dom_id: "#swagger-ui",
              presets: [
                window.SwaggerUIBundle.presets.apis,
                window.SwaggerUIStandalonePreset,
              ],
              layout: "StandaloneLayout",
              deepLinking: true,
              defaultModelsExpandDepth: 1,
              defaultModelExpandDepth: 1,
            });
          }
        }}
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />

      {/* Header */}
      <header className="bg-green-600 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-2xl font-bold">Link Flame API Documentation</h1>
          <a
            href="/"
            className="text-white transition-colors hover:text-green-100"
          >
            Back to Site
          </a>
        </div>
      </header>

      {/* Swagger UI Container */}
      <div id="swagger-ui" ref={containerRef} className="mx-auto max-w-7xl" />

      {/* Custom styles */}
      <style jsx global>{`
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .scheme-container {
          padding: 20px 0;
        }
      `}</style>
    </div>
  );
}
