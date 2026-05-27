import type { Metadata, Viewport } from "next";
import { ToasterProvider } from "./_components/ToasterProvider";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_ACCOUNT_APP_URL || "https://myaccount.chefuinc.com";

export const metadata: Metadata = {
    metadataBase: new URL(appUrl),
    title: {
        default: "CheFu Account",
        template: "%s | CheFu Account",
    },
    description:
        "Sign in, manage profile settings, review connected apps, and control CheFu Account preferences.",
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: "CheFu Account",
        description:
            "One secure account for CheFu Academy, Flow, Muzalo, Quantum, and future CheFu products.",
        url: appUrl,
        siteName: "CheFu Account",
        type: "website",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#202124",
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
