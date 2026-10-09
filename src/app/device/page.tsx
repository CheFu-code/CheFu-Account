"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

function DeviceAuthContent() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState(searchParams.get("code") || "");
    const [deviceCode, setDeviceCode] = useState(searchParams.get("deviceCode") || "");
    const [mfaCode, setMfaCode] = useState("");
    const [mfaPendingCredential, setMfaPendingCredential] = useState("");
    const [mfaEnrollmentId, setMfaEnrollmentId] = useState("");
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
        if (!deviceCode || (!mfaPendingCredential && (!email || !password))) {
            setStatus("error");
            setMessage("Enter the required sign-in details and the device code shown in the terminal.");
            return;
        }

        setStatus("submitting");
        setMessage("Finishing sign-in…");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.chefu.co.za"}/auth/device/${mfaPendingCredential ? "mfa-complete" : "complete"}`,
                {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deviceCode,
                    userCode: code,
                    email,
                    ...(mfaPendingCredential
                        ? {
                              mfaPendingCredential,
                              mfaEnrollmentId,
                              verificationCode: mfaCode,
                          }
                        : { password }),
                }),
                },
            );

            const data = (await response.json().catch(() => ({}))) as {
                mfaRequired?: boolean;
                mfaPendingCredential?: string;
                mfaInfo?: Array<{ mfaEnrollmentId?: string; factorId?: string }>;
                message?: string;
                error?: string;
            };
            if (!response.ok) {
                throw new Error(data?.message || data?.error || "Unable to finish sign-in.");
            }
            if (data.mfaRequired) {
                const factor = data.mfaInfo?.find(
                    (item) => item.factorId === "totp" && item.mfaEnrollmentId,
                );
                if (!data.mfaPendingCredential || !factor?.mfaEnrollmentId) {
                    throw new Error("The server could not start multi-factor sign-in.");
                }
                setMfaPendingCredential(data.mfaPendingCredential);
                setMfaEnrollmentId(factor.mfaEnrollmentId);
                setMfaCode("");
                setStatus("idle");
                setMessage("Enter your authenticator code to finish signing in.");
                return;
            }

            setStatus("success");
            setMessage("Sign-in completed. You can return to the terminal and press Enter.");
        } catch (error) {
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
                    {!mfaPendingCredential && (
                        <>
                            <label style={{ display: "grid", gap: 8 }}>
                                <span style={{ color: "#cbd5e1" }}>Email</span>
                                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" style={{ borderRadius: 10, border: "1px solid #475569", background: "#020817", color: "white", padding: "12px 14px" }} />
                            </label>

                            <label style={{ display: "grid", gap: 8 }}>
                                <span style={{ color: "#cbd5e1" }}>Password</span>
                                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" style={{ borderRadius: 10, border: "1px solid #475569", background: "#020817", color: "white", padding: "12px 14px" }} />
                            </label>
                        </>
                    )}

                    <label style={{ display: "grid", gap: 8 }}>
                        <span style={{ color: "#cbd5e1" }}>Terminal code</span>
                        <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="CHEFU-ABCD" style={{ borderRadius: 10, border: "1px solid #475569", background: "#020817", color: "white", padding: "12px 14px", letterSpacing: 1.5 }} />
                    </label>

                    {mfaPendingCredential ? (
                        <label style={{ display: "grid", gap: 8 }}>
                            <span style={{ color: "#cbd5e1" }}>Authenticator code</span>
                            <input
                                autoComplete="one-time-code"
                                inputMode="numeric"
                                maxLength={6}
                                value={mfaCode}
                                onChange={(event) =>
                                    setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                placeholder="000000"
                                style={{ borderRadius: 10, border: "1px solid #475569", background: "#020817", color: "white", padding: "12px 14px", letterSpacing: 2 }}
                            />
                        </label>
                    ) : null}

                    <button disabled={status === "submitting"} type="submit" style={{ marginTop: 8, border: "none", padding: "12px 16px", borderRadius: 10, background: "#2563eb", color: "white", fontWeight: 700, cursor: "pointer", opacity: status === "submitting" ? 0.7 : 1 }}>
                        {status === "submitting"
                            ? "Finishing…"
                            : mfaPendingCredential
                              ? "Verify and finish sign-in"
                              : "Finish sign-in"}
                    </button>
                </form>
            </div>
        </main>
    );
}

export default function DeviceAuthPage() {
    return (
        <Suspense>
            <DeviceAuthContent />
        </Suspense>
    );
}
