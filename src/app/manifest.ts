import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "My Account",
        short_name: "My Account",
        id: "/account",
        lang: "en-ZA",
        dir: "ltr",
        description: "Manage your account, security, and connected apps.",
        categories: ["business", "productivity", "utilities"],
        prefer_related_applications: false,
        start_url: "/account",
        scope: "/",
        display_override: ["window-controls-overlay", "standalone"],
        display: "standalone",
        launch_handler: {
            client_mode: "navigate-existing",
        },
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
        shortcuts: [
            {
                name: "Profile overview",
                short_name: "Profile",
                description: "View your account profile overview.",
                url: "/account",
                icons: [{ src: "/pwa-192.png", sizes: "192x192" }],
            },
            {
                name: "Security settings",
                short_name: "Security",
                description: "Manage your account security settings.",
                url: "/account?section=security",
                icons: [{ src: "/pwa-192.png", sizes: "192x192" }],
            },
            {
                name: "Privacy settings",
                short_name: "Privacy",
                description: "Manage privacy and connected app access.",
                url: "/account?section=privacy",
                icons: [{ src: "/pwa-192.png", sizes: "192x192" }],
            },
        ],
    };
}
