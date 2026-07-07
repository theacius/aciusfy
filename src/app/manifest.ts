import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aciusfy - Müziği Hisset, Anlamı Keşfet",
    short_name: "Aciusfy",
    description:
      "Yeni nesil müzik streaming platformu. Milyonlarca şarkıyı keşfet, playlistler oluştur ve müzik deneyimini yaşa.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#181818",
    orientation: "portrait-primary",
    categories: ["music", "entertainment"],
    icons: [
      {
        src: "/branding/aciusfy-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/aciusfy-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
