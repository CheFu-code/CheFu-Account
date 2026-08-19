"use client";

import {
    ArrowRight,
    Eye,
    EyeOff,
    Fingerprint,
    Loader2,
    LockKeyhole,
    Mail,
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type AccountAuthBaseProps = {
    alternateHref: string;
    appName: string;
    email: string;
    isSubmitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    setEmail: (email: string) => void;
    onPasskeyClick?: () => void;
    isPasskeySubmitting?: boolean;
};

type AccountAuthScreenProps =
    | (AccountAuthBaseProps & {
        forgotPasswordHref: string;
        mode: "login";
        password: string;
        setPassword: (password: string) => void;
    })
    | (AccountAuthBaseProps & {
        forgotPasswordHref?: never;
        mode: "register";
        password: string;
        setPassword: (password: string) => void;
    })
    | (AccountAuthBaseProps & {
        forgotPasswordHref?: never;
        mode: "forgot-password";
        password?: never;
        setPassword?: never;
    });

const modeCopy = {
    login: {
        alternateAction: "Create an account",
        alternateLead: "Don't have an account?",
        buttonIdle: "Sign in",
        eyebrow: "Welcome back",
        passwordAutoComplete: "current-password",
        passwordHelp: "",
        submitting: "Opening your account...",
    },
    register: {
        alternateAction: "Sign in instead",
        alternateLead: "Already have an account?",
        buttonIdle: "Create your account",
        eyebrow: "One account for everything",
        passwordAutoComplete: "new-password",
        passwordHelp: "At least 6 characters",
        submitting: "Creating your account...",
    },
    "forgot-password": {
        alternateAction: "Back to sign in",
        alternateLead: "Remembered your password?",
        buttonIdle: "Send a reset link",
        eyebrow: "Account recovery",
        heading: "Let’s get you back in.",
        passwordAutoComplete: "off",
        passwordHelp: "",
        supporting: "Enter your account email and we’ll send a private reset link right away.",
        submitting: "Sending your reset link...",
    },
} as const;

export function AccountAuthScreen(props: AccountAuthScreenProps) {
    const { alternateHref, appName, email, isSubmitting, mode, onSubmit, setEmail } = props;
    const [showPassword, setShowPassword] = useState(false);
    const copy = modeCopy[mode];

    return (
        <main className="relative min-h-dvh overflow-hidden bg-[#11110f] text-[#f4f0e8]">
            <div className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(rgba(244,240,232,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(244,240,232,0.035)_1px,transparent_1px)] bg-size-[48px_48px]" />
            <div className="pointer-events-none absolute -right-44 top-20 size-125 rounded-full border border-[#e5ad5b]/18" />
            <div className="pointer-events-none absolute -right-20 top-44 size-90 rounded-full border border-[#e5ad5b]/10" />

            <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-10 pt-7 sm:px-8 sm:pb-14 lg:min-h-[calc(100dvh-84px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.72fr)] lg:px-10 lg:py-16">
                <aside className="hidden max-w-xl self-center lg:block">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#e5ad5b]">
                        <span className="h-px w-9 bg-[#e5ad5b]/70" />
                        Single Sign-On
                    </p>
                    <h1 className="mt-7 text-5xl font-medium leading-[1.04] tracking-[-0.055em] text-[#f4f0e8] xl:text-6xl">
                        One considered identity for your whole digital life.
                    </h1>
                    <p className="mt-7 max-w-lg text-base leading-7 text-[#bdb5a8]">
                        Sign in once, then move seamlessly between all the tools, resources, and applications in the network.
                    </p>
                    <div className="mt-12 grid max-w-md grid-cols-3 gap-3 border-t border-white/10 pt-5">
                        <Proof label="One identity" value="Every app" />
                        <Proof label="Built around" value="You" />
                        <Proof label="Protected by" value="Design" />
                    </div>
                </aside>

                <section className="w-full max-w-xl justify-self-center lg:justify-self-end">
                    <div className="rounded-4xl border border-white/12 bg-[#1a1916]/92 p-5 shadow-[0_32px_100px_rgba(0,0,0,0.38)] backdrop-blur sm:p-8">
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e5ad5b]">
                                    {copy.eyebrow}
                                </p>

                            </div>
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#e5ad5b]/22 bg-[#e5ad5b]/10 text-[#ffd18a]">
                                <ShieldCheck className="size-5" aria-hidden="true" />
                            </span>
                        </div>

                        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-[#d7d0c5]">
                            <span className="size-1.5 rounded-full bg-[#e5ad5b]" />
                            Continuing to {appName}
                        </div>

                        <form onSubmit={onSubmit} className="mt-7 space-y-5">
                            <label className="block" htmlFor="email">
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#d7d0c5]">
                                    Email address
                                </span>
                                <span className="relative block">
                                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8f887d]" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="you@example.com"
                                        className="h-13 w-full rounded-2xl border border-white/12 bg-[#11110f] pl-11 pr-4 text-sm text-[#f4f0e8] outline-none transition placeholder:text-[#736c63] hover:border-white/20 focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </span>
                            </label>

                            {mode !== "forgot-password" ? (
                                <label className="block" htmlFor="password">
                                    <span className="mb-2 flex items-center justify-between gap-3">
                                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#d7d0c5]">
                                            Password
                                        </span>
                                        {mode === "login" ? (
                                            <Link href={props.forgotPasswordHref} className="text-xs font-semibold text-[#e5ad5b] transition hover:text-[#ffd18a]">
                                                Forgot it?
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-[#8f887d]">{copy.passwordHelp}</span>
                                        )}
                                    </span>
                                    <span className="relative block">
                                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8f887d]" />
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={props.password}
                                            onChange={(event) => props.setPassword(event.target.value)}
                                            placeholder="Enter your password"
                                            className="h-13 w-full rounded-2xl border border-white/12 bg-[#11110f] pl-11 pr-12 text-sm text-[#f4f0e8] outline-none transition placeholder:text-[#736c63] hover:border-white/20 focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
                                            autoComplete={copy.passwordAutoComplete}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#8f887d] transition hover:bg-white/7 hover:text-[#f4f0e8]"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </span>
                                </label>
                            ) : null}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#e5ad5b] px-5 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                                {isSubmitting ? copy.submitting : copy.buttonIdle}
                            </button>

                            {mode === "login" && props.onPasskeyClick ? (
                                <button
                                    type="button"
                                    onClick={props.onPasskeyClick}
                                    disabled={props.isPasskeySubmitting || isSubmitting}
                                    className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/4 px-5 text-sm font-bold text-[#d7d0c5] transition hover:border-[#e5ad5b]/35 hover:bg-white/8 hover:text-[#f4f0e8] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {props.isPasskeySubmitting ? (
                                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Fingerprint className="size-4" aria-hidden="true" />
                                    )}
                                    {props.isPasskeySubmitting ? "Scanning..." : "Sign in with passkey"}
                                </button>
                            ) : null}
                        </form>

                        <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-[#8f887d]">{copy.alternateLead}</p>
                            <Link href={alternateHref} className="inline-flex items-center gap-2 font-semibold text-[#e5ad5b] transition hover:text-[#ffd18a]">
                                {copy.alternateAction}
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>

                    <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 px-2 text-[11px] font-medium text-[#8f887d]">
                        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Private by design</span>
                        <span className="flex gap-3">
                            <Link href="https://chefuinc.com/privacy" className="transition hover:text-[#f4f0e8]">Privacy</Link>
                            <Link href="https://chefuinc.com/terms" className="transition hover:text-[#f4f0e8]">Terms</Link>
                            <Link href="https://chefuinc.com/contact" className="transition hover:text-[#f4f0e8]">Contact</Link>
                        </span>
                    </footer>
                </section>
            </div>
        </main>
    );
}

function Proof({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#797267]">{label}</p>
            <p className="mt-1.5 text-sm font-semibold text-[#f4f0e8]">{value}</p>
        </div>
    );
}
