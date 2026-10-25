"use client";

import { useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/chefu-account";

export function useTrustedBrowser(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const validEmail = !normalizedEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const [result, setResult] = useState<{ email: string; trusted: boolean } | null>(null);
    const budget = useRef({ next: 0, blockedUntil: 0, windowEnds: 0, count: 0, cache: new Map<string, { trusted: boolean; until: number }>() });

    useEffect(() => {
        if (!validEmail) return;
        let active = true;
        let controller: AbortController | undefined;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const check = async () => {
            const now = Date.now();
            const limits = budget.current;
            const cached = limits.cache.get(normalizedEmail);
            if (cached && cached.until > now) {
                setResult({ email: normalizedEmail, trusted: cached.trusted });
                return;
            }
            if (now >= limits.windowEnds) { limits.windowEnds = now + 60_000; limits.count = 0; }
            if (now < limits.blockedUntil || limits.count >= 6) {
                setResult({ email: normalizedEmail, trusted: false });
                return;
            }
            if (now < limits.next) return;
            limits.next = now + 2000;
            limits.count++;
            controller?.abort();
            clearTimeout(timeout);
            const request = new AbortController();
            controller = request;
            timeout = setTimeout(() => request.abort(), 5000);
            try {
                const response = await fetch(apiUrl("/auth/trusted-devices/status"), {
                    method: "POST",
                    credentials: "include",
                    cache: "no-store",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: normalizedEmail }),
                    signal: request.signal,
                });
                const body = await response.json() as { trusted?: unknown; retryAfterSeconds?: unknown };
                if (active && controller === request) {
                    if (response.status === 429) {
                        const retry = Number(body.retryAfterSeconds);
                        limits.blockedUntil = Date.now() + (Number.isFinite(retry) ? Math.max(5, Math.min(300, retry)) : 60) * 1000;
                    } else if (!response.ok) limits.blockedUntil = Date.now() + 15_000;
                    const trusted = response.ok && body.trusted === true;
                    limits.cache.delete(normalizedEmail);
                    limits.cache.set(normalizedEmail, { trusted, until: Date.now() + (response.ok ? 30_000 : 5000) });
                    while (limits.cache.size > 8) {
                        const oldest = limits.cache.keys().next().value;
                        if (oldest === undefined) break;
                        limits.cache.delete(oldest);
                    }
                    setResult({ email: normalizedEmail, trusted });
                }
            } catch {
                // An unavailable status endpoint must not prevent sign-in or
                // falsely claim that the browser has already been trusted.
                if (active && controller === request) {
                    limits.blockedUntil = Date.now() + 15_000;
                    setResult({ email: normalizedEmail, trusted: false });
                }
            } finally {
                if (controller === request) clearTimeout(timeout);
            }
        };
        const cached = budget.current.cache.get(normalizedEmail);
        const delay = cached && cached.until > Date.now() ? 0 : Math.max(normalizedEmail ? 600 : 0, budget.current.next - Date.now());
        const debounce = setTimeout(() => void check(), delay);
        const focus = () => {
            if (Date.now() < budget.current.next && (budget.current.cache.get(normalizedEmail)?.until ?? 0) <= Date.now()) return;
            clearTimeout(debounce);
            void check();
        };
        window.addEventListener("focus", focus);
        return () => {
            active = false;
            clearTimeout(debounce);
            clearTimeout(timeout);
            controller?.abort();
            window.removeEventListener("focus", focus);
        };
    }, [normalizedEmail, validEmail]);

    return {
        checking: !validEmail || result?.email !== normalizedEmail,
        trusted: result?.email === normalizedEmail && result.trusted,
    };
}
