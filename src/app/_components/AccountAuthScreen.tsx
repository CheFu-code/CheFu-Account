"use client";

import type { AccountAuthScreenProps } from "@/app/types";
import { Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { modeCopy } from "../constants/auth";
import { TrustedBrowserChoice } from "../login/TrustedBrowserChoice";

const inputClass = "account-auth-input";

const linkClass =
    "account-auth-link font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2";

export function AccountAuthScreen(props: AccountAuthScreenProps) {
    const { alternateHref, appName, email, isSubmitting, mode, onSubmit, setEmail } = props;
    const [showPassword, setShowPassword] = useState(false);
    const copy = modeCopy[mode];
    const showPasskey = mode === "login" && Boolean(props.onPasskeyClick);

    return (
        <main className="account-auth-screen flex min-h-dvh flex-col px-4">
            <div className="flex flex-1 flex-col items-center justify-center py-12">
                <div className="account-auth-card w-full max-w-105 rounded-xl border p-7 shadow-sm sm:p-9">
                    <h1 className="text-2xl font-semibold tracking-tight">{copy.eyebrow}</h1>
                    <p className="account-auth-muted mt-1.5 text-sm">Continue to {appName}</p>

                    {props.onReturnToPicker && (
                        <button type="button" onClick={props.onReturnToPicker}
                            disabled={isSubmitting || props.isPasskeySubmitting}
                            className="account-auth-link mt-4 min-h-11 text-sm font-medium underline underline-offset-4 disabled:opacity-50">
                            Back to saved accounts
                        </button>
                    )}

                    <form
                        onSubmit={onSubmit}
                        autoComplete={mode === "register" ? "off" : undefined}
                        className="mt-8 space-y-5"
                    >
                        {mode === "register" ? (
                            <div className="account-auth-register-names grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="first-name" className="account-auth-label mb-1.5 block text-sm font-medium">
                                        First name
                                    </label>
                                    <input
                                        id="first-name"
                                        type="text"
                                        value={props.firstName}
                                        onChange={(event) => props.setFirstName(event.target.value)}
                                        placeholder="First name"
                                        className={inputClass}
                                        autoComplete={mode === "register" ? "off" : "given-name"}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label htmlFor="last-name" className="account-auth-label mb-1.5 block text-sm font-medium">
                                        Last name
                                    </label>
                                    <input
                                        id="last-name"
                                        type="text"
                                        value={props.lastName}
                                        onChange={(event) => props.setLastName(event.target.value)}
                                        placeholder="Last name"
                                        className={inputClass}
                                        autoComplete={mode === "register" ? "off" : "family-name"}
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div>
                            <label htmlFor="email" className="account-auth-label mb-1.5 block text-sm font-medium">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                className={inputClass}
                                autoComplete={mode === "register" ? "off" : "email"}
                                autoFocus={mode !== "register"}
                            />
                        </div>

                        {mode !== "forgot-password" ? (
                            <div>
                                <div className="mb-1.5 flex items-center justify-between gap-3">
                                    <label htmlFor="password" className="account-auth-label text-sm font-medium">
                                        Password
                                    </label>
                                    {mode === "login" ? (
                                        <Link href={props.forgotPasswordHref} className={`text-sm ${linkClass}`}>
                                            Forgot password?
                                        </Link>
                                    ) : (
                                        <span className="account-auth-muted text-sm">{copy.passwordHelp}</span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={props.password}
                                        onChange={(event) => props.setPassword(event.target.value)}
                                        placeholder="Enter your password"
                                        className={`${inputClass} pr-11`}
                                        autoComplete={copy.passwordAutoComplete}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="account-auth-password-toggle absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md transition focus-visible:outline-2"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {mode === "register" ? (
                                    <p className="account-auth-muted mt-3 text-center text-xs leading-5">
                                        By creating an account, you agree to our{" "}
                                        <Link href="https://chefu.co.za/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
                                            Terms of Service
                                        </Link>{" "}
                                        and{" "}
                                        <Link href="https://chefu.co.za/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
                                            Privacy Policy
                                        </Link>
                                        .
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        {mode === "login" && props.setTrustDevice ? (
                            <TrustedBrowserChoice
                                email={email}
                                checked={props.trustDevice ?? false}
                                onChange={props.setTrustDevice}
                                disabled={isSubmitting || Boolean(props.isPasskeySubmitting)}
                            />
                        ) : null}

                        <div className={`grid gap-3 ${showPasskey ? "grid-cols-2" : "grid-cols-1"}`}>
                            <button
                                type="submit"
                                disabled={isSubmitting || props.isPasskeySubmitting}
                                className="account-auth-submit inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium leading-5 transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
                                {isSubmitting ? copy.submitting : copy.buttonIdle}
                            </button>

                            {showPasskey ? (
                                <button
                                    type="button"
                                    onClick={props.onPasskeyClick}
                                    aria-label={props.isPasskeySubmitting ? "Waiting for passkey" : "Sign in with a passkey"}
                                    disabled={props.isPasskeySubmitting || isSubmitting}
                                    className="account-auth-passkey inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-sm font-medium leading-5 transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {props.isPasskeySubmitting ? (
                                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Fingerprint className="size-4 shrink-0" aria-hidden="true" />
                                    )}
                                    {props.isPasskeySubmitting ? "Waiting…" : "Passkey"}
                                </button>
                            ) : null}
                        </div>
                    </form>
                    {mode === "login" && <div className="mt-6 border-t border-[var(--border)] pt-5 text-center">
                        <p className="account-auth-muted text-sm">New to {appName}?</p>
                        <Link href={alternateHref} className="account-auth-dialog-skip mt-3 inline-flex w-full items-center justify-center font-semibold">
                            Create account
                        </Link>
                    </div>}
                </div>

                {mode !== "login" && <p className="account-auth-muted mt-6 text-sm">
                    {copy.alternateLead}{" "}
                    <Link href={alternateHref} className={linkClass}>
                        {copy.alternateAction}
                    </Link>
                </p>}
            </div>

            <footer className="account-auth-footer flex justify-center gap-5 pb-6 text-xs">
                <Link target="_blank" rel="noopener noreferrer" href="https://chefu.co.za/privacy">Privacy</Link>
                <Link target="_blank" rel="noopener noreferrer" href="https://chefu.co.za/terms">Terms</Link>
                <Link target="_blank" rel="noopener noreferrer" href="https://chefu.co.za/contact">Contact</Link>
            </footer>
        </main>
    );
}
