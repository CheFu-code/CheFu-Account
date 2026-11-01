import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "My Account",
        short_name: "My Account",
        description: "Manage your account, security, and connected apps.",
        start_url: "/account",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        orientation: "portrait",
        icons: [
            {
                src: "/pwa-192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/pwa-512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
