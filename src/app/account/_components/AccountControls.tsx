"use client";

import { Loader2, LockKeyhole, Save, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toTitle } from "./account-data";

export function SectionCard({
    action,
    aside,
    children,
    description,
    icon: Icon,
    title,
}: {
    action?: ReactNode;
    aside?: string;
    children: ReactNode;
    description: string;
    icon: LucideIcon;
    title: string;
}) {
    return (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#191b20]/95 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="border-b border-white/10 bg-white/2.5 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                            <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-white">
                                {title}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-400">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {aside ? (
                            <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-slate-200">
                                {aside}
                            </span>
                        ) : null}
                        {action}
                    </div>
                </div>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

export function QuickLink({
    icon: Icon,
    label,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/3 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-200/30 hover:bg-white/10"
        >
            <Icon className="size-4" aria-hidden="true" />
            {label}
        </button>
    );
}

export function ActionRow({
    action,
    description,
    icon: Icon,
    title,
}: {
    action: ReactNode;
    description: string;
    icon: LucideIcon;
    title: string;
}) {
    return (
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/4 text-slate-300">
                    <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
            </div>
            {action}
        </div>
    );
}

export function ToggleRow({
    checked,
    description,
    onToggle,
    title,
}: {
    checked: boolean;
    description: string;
    onToggle: () => void;
    title: string;
}) {
    return (
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
            </div>
            <button
                type="button"
                onClick={onToggle}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    checked ? "bg-emerald-400" : "bg-slate-700"
                }`}
                aria-pressed={checked}
            >
                <span
                    className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${
                        checked ? "left-6" : "left-1"
                    }`}
                />
            </button>
        </div>
    );
}

export function TextField({
    label,
    max,
    min,
    onChange,
    placeholder,
    type = "text",
    value,
    wide,
}: {
    label: string;
    max?: number;
    min?: number;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    value: string;
    wide?: boolean;
}) {
    return (
        <label className={`block ${wide ? "md:col-span-2" : ""}`}>
            <span className="text-sm font-semibold text-slate-200">{label}</span>
            <input
                type={type}
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111318] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                placeholder={placeholder}
            />
        </label>
    );
}

export function LockedInfo({
    description,
    label,
    value,
}: {
    description?: string;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#111318] p-4">
            <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 size-4 text-slate-400" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200">{label}</p>
                    <p className="mt-1 truncate text-sm text-white">{value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
                </div>
            </div>
        </div>
    );
}

export function SelectField({
    label,
    onChange,
    options,
    value,
}: {
    label: string;
    onChange: (value: string) => void;
    options: readonly string[];
    value: string;
}) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-slate-200">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111318] px-4 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {toTitle(option)}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function SaveButton({ isSaving, label }: { isSaving: boolean; label: string }) {
    return (
        <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
                <Save className="size-4" aria-hidden="true" />
            )}
            {label}
        </button>
    );
}
