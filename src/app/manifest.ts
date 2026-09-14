import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LocalReach",
    short_name: "LocalReach",
    description:
      "Your neighbourhood. Your marketplace. Buy, sell and discover local businesses in your community.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f7",
    theme_color: "#158258",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
