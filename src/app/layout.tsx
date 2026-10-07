import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToasterProvider } from "./_components/ToasterProvider";
import "./globals.css";

const appUrl =
    process.env.NEXT_PUBLIC_ACCOUNT_APP_URL || "https://myaccount.chefu.co.za";

export const metadata: Metadata = {
    metadataBase: new URL(appUrl),
    applicationName: "My Account",
    title: {
        default: "My Account",
        template: "%s | My Account",
    },
    description:
        "Sign in, manage profile settings, review connected apps, and control your account preferences.",
    alternates: {
        canonical: "/",
    },
    robots: {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true,
        nosnippet: true,
        noimageindex: true,
        googleBot: {
            index: false,
            follow: false,
            noarchive: true,
            nosnippet: true,
            noimageindex: true,
        },
    },
    referrer: "strict-origin-when-cross-origin",
    formatDetection: {
        telephone: false,
        email: false,
        address: false,
    },
    openGraph: {
        title: "My Account",
        description: "One secure account for all your products.",
        url: appUrl,
        siteName: "My Account",
        locale: "en_ZA",
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "My Account",
        description: "One secure account for all your products.",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    colorScheme: "light dark",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `try {
  var theme = window.localStorage.getItem("chefu-account-theme");
  if (theme === "dark" || theme === "light") {
    document.documentElement.setAttribute("data-theme", theme);
  }
} catch (_) {}`,
                    }}
                />
                {children}
                <Analytics />
                <ToasterProvider />
            </body>
        </html>
    );
}