import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ABCARINO — عبقرينو",
    short_name: "ABCARINO",
    description: "Intelligent technology solutions & systems integration.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0f11",
    theme_color: "#0e0f11",
    icons: [
      { src: "/brand/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
