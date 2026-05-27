import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl =
        process.env.NEXT_PUBLIC_ACCOUNT_APP_URL || "https://myaccount.chefuinc.com";

    return [
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.2,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.2,
        },
    ];
}
