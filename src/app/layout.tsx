import type { Metadata, Viewport } from "next";
import { ToasterProvider } from "./_components/ToasterProvider";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_ACCOUNT_APP_URL || "https://myaccount.chefu.co.za";

export const metadata: Metadata = {
    metadataBase: new URL(appUrl),
    title: {
        default: "My Account",
        template: "%s | My Account",
    },
    description:
        "Sign in, manage profile settings, review connected apps, and control your account preferences.",
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: "My Account",
        description:
            "One secure account for all my products.",
        url: appUrl,
        siteName: "My Account",
        type: "website",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#11110f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
                <ToasterProvider />
            </body>
        </html>
    );
}
