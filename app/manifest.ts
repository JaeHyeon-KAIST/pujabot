import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PujaBot — AI Puja Coordinator",
    short_name: "PujaBot",
    description:
      "Which puja, with whom, how — answered in 1 minute. Pandit-reviewed, never AI-generated.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8ec",
    theme_color: "#fff8ec",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
