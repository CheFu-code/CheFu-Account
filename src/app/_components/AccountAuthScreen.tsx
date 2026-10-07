"use client";

import type { AccountAuthScreenProps } from "@/app/types";
import { Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { modeCopy } from "../constants/auth";

const inputClass =
    "h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 hover:border-stone-400 focus:border-amber-700 focus:ring-3 focus:ring-amber-700/15";

const linkClass =
    "font-medium text-amber-800 underline-offset-4 hover:text-amber-900 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700";

export function AccountAuthScreen(props: AccountAuthScreenProps) {
    const { alternateHref, appName, email, isSubmitting, mode, onSubmit, setEmail } = props;
    const [showPassword, setShowPassword] = useState(false);
    const copy = modeCopy[mode];

    return (
        <main className="flex min-h-dvh flex-col bg-stone-100 px-4 text-stone-900">
            <div className="flex flex-1 flex-col items-center justify-center py-12">
                <div className="w-full max-w-105 rounded-xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
                    <h1 className="text-2xl font-semibold tracking-tight">{copy.eyebrow}</h1>
                    <p className="mt-1.5 text-sm text-stone-600">Continue to {appName}</p>

                    <form
                        onSubmit={onSubmit}
                        autoComplete={mode === "register" ? "off" : undefined}
                        className="mt-8 space-y-5"
                    >
                        {mode === "register" ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="first-name" className="mb-1.5 block text-sm font-medium text-stone-800">
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
                                    <label htmlFor="last-name" className="mb-1.5 block text-sm font-medium text-stone-800">
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
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-800">
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
                                    <label htmlFor="password" className="text-sm font-medium text-stone-800">
                                        Password
                                    </label>
                                    {mode === "login" ? (
                                        <Link href={props.forgotPasswordHref} className={`text-sm ${linkClass}`}>
                                            Forgot password?
                                        </Link>
                                    ) : (
                                        <span className="text-sm text-stone-500">{copy.passwordHelp}</span>
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
                                        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-amber-700"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {mode === "register" ? (
                                    <p className="mt-3 text-center text-xs leading-5 text-stone-500">
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

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                            {isSubmitting ? copy.submitting : copy.buttonIdle}
                        </button>

                        {mode === "login" && props.onPasskeyClick ? (
                            <>
                                <div className="flex items-center gap-3 text-xs text-stone-500" aria-hidden="true">
                                    <span className="h-px flex-1 bg-stone-200" />
                                    or
                                    <span className="h-px flex-1 bg-stone-200" />
                                </div>
                                <button
                                    type="button"
                                    onClick={props.onPasskeyClick}
                                    disabled={props.isPasskeySubmitting || isSubmitting}
                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 transition hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {props.isPasskeySubmitting ? (
                                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Fingerprint className="size-4" aria-hidden="true" />
                                    )}
                                    {props.isPasskeySubmitting ? "Waiting for passkey…" : "Sign in with a passkey"}
                                </button>
                            </>
                        ) : null}
                    </form>
                </div>

                <p className="mt-6 text-sm text-stone-600">
                    {copy.alternateLead}{" "}
                    <Link href={alternateHref} className={linkClass}>
                        {copy.alternateAction}
                    </Link>
                </p>
            </div>

            <footer className="flex justify-center gap-5 pb-6 text-xs text-stone-500">
                <Link target="_blank" rel="noopener noreferrer" href="https://chefu.co.za/privacy" className="hover:text-stone-900 hover:underline underline-offset-4">Privacy</Link>
                <Link target="_blank" rel="noopener noreferrer" href="https://chefu.co.za/terms" className="hover:text-stone-900 hover:underline underline-offset-4">Terms</Link>
                <Link target="_blank" rel="noopener noreferrer" href="https://chefu.co.za/contact" className="hover:text-stone-900 hover:underline underline-offset-4">Contact</Link>
            </footer>
        </main>
    );
}