"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function DeviceAuthPage() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState(searchParams.get("code") || "");
    const [deviceCode, setDeviceCode] = useState(searchParams.get("deviceCode") || "");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [message, setMessage] = useState("Sign in with your Chefu account to finish the terminal login.");
    const mounted = useRef(false);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            const q = searchParams.get("code");
            const d = searchParams.get("deviceCode");
            if (q) setCode(q);
            if (d) setDeviceCode(d);
        }
    }, [searchParams]);

    const deviceCodeHint = useMemo(() => {
        return deviceCode ? deviceCode.slice(0, 12) : "";
    }, [deviceCode]);

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email || !password || !deviceCode) {
            setStatus("error");
            setMessage("Enter your email, password, and the device code shown in the terminal.");
            return;
        }

        setStatus("submitting");
        setMessage("Finishing sign-in…");

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await credential.user.getIdToken(true);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefu.co.za"}/auth/device/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deviceCode,
                    userCode: code,
                    email,
                    password,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || data?.error || "Unable to finish sign-in.");
            }

            if (idToken) {
                await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefu.co.za"}/auth/session`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        "x-chefu-app": "root",
                    },
                    credentials: "include",
                }).catch(() => undefined);
            }

            setStatus("success");
            setMessage("Sign-in completed. You can return to the terminal and press Enter.");
        } catch (error) {
            await signOut(auth).catch(() => undefined);
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Unable to finish sign-in.");
        }
    };

    return (
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b1020", color: "#f3f7ff", fontFamily: "sans-serif" }}>
            <div style={{ width: "min(420px, calc(100vw - 32px))", background: "#111827", borderRadius: 18, padding: 28, boxShadow: "0 25px 50px rgba(0,0,0,0.35)" }}>
                <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#93c5fd", marginBottom: 12 }}>Chefu Device Login</div>
                <h1 style={{ margin: 0, fontSize: 30, marginBottom: 8 }}>Finish signing in</h1>
                <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.5, marginBottom: 20 }}>{message}</p>

                {deviceCodeHint && (
                    <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: 12, marginBottom: 20 }}>
                        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>Device code</div>
                        <div style={{ fontWeight: 700, letterSpacing: 2 }}>{deviceCodeHint}</div>
                    </div>
                )}

                <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                    <label style={{ display: "grid", gap: 8 }}>
                        <span style={{ color: "#cbd5e1" }}>Email</span>
                        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" style={{ borderRadius: 10, border: "1px solid #475569", background: "#020817", color: "white", padding: "12px 14px" }} />
                    </label>

                    <label style={{ display: "grid", gap: 8 }}>
                        <span style={{ color: "#cbd5e1" }}>Password</span>
                        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" style={{ borderRadius: 10, border: "1px solid #475569", background: "#020817", color: "white", padding: "12px 14px" }} />
                    </label>

                    <label style={{ display: "grid", gap: 8 }}>
                        <span style={{ color: "#cbd5e1" }}>Terminal code</span>
                        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="CHEFU-ABCD" style={{ borderRadius: 10, border: "1px solid #475569", background: "#020817", color: "white", padding: "12px 14px", letterSpacing: 1.5 }} />
                    </label>

                    <button disabled={status === "submitting"} type="submit" style={{ marginTop: 8, border: "none", padding: "12px 16px", borderRadius: 10, background: "#2563eb", color: "white", fontWeight: 700, cursor: "pointer", opacity: status === "submitting" ? 0.7 : 1 }}>
                        {status === "submitting" ? "Finishing…" : "Finish sign-in"}
                    </button>
                </form>
            </div>
        </main>
    );
}
