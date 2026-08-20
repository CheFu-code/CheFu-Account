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
        <section className="overflow-hidden rounded-4xl border border-white/10 bg-[#1a1916]/95 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="border-b border-white/10 bg-white/2.5 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#e5ad5b]/22 bg-[#e5ad5b]/10 text-[#ffd18a]">
                            <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#f4f0e8]">
                                {title}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-[#8f887d]">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {aside ? (
                            <span className="rounded-full border border-[#e5ad5b]/18 bg-[#e5ad5b]/9 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ffd18a]">
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
            className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/4 px-3 py-2 text-xs font-semibold text-[#d7d0c5] transition hover:border-[#e5ad5b]/35 hover:bg-white/8 hover:text-[#f4f0e8]"
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
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#bdb5a8]">
                    <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                    <p className="font-semibold text-[#f4f0e8]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#8f887d]">{description}</p>
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
                <p className="font-semibold text-[#f4f0e8]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#8f887d]">{description}</p>
            </div>
            <button
                type="button"
                onClick={onToggle}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    checked ? "bg-[#e5ad5b]" : "bg-[#4b463e]"
                }`}
                aria-pressed={checked}
            >
                <span
                    className={`absolute top-1 size-4 rounded-full bg-white shadow transition ${
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
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">{label}</span>
            <input
                type={type}
                min={min}
                max={max}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-sm text-[#f4f0e8] outline-none transition placeholder:text-[#736c63] hover:border-white/20 focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
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
        <div className="rounded-2xl border border-white/10 bg-[#11110f] p-4">
            <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 size-4 text-[#8f887d]" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#8f887d]">{label}</p>
                    <p className="mt-1.5 truncate text-sm font-medium text-[#f4f0e8]">{value}</p>
                    {description ? <p className="mt-1 text-xs leading-5 text-[#797267]">{description}</p> : null}
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
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#bdb5a8]">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-white/12 bg-[#11110f] px-4 text-sm text-[#f4f0e8] outline-none transition hover:border-white/20 focus:border-[#e5ad5b]/70 focus:ring-4 focus:ring-[#e5ad5b]/10"
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
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e5ad5b] px-4 py-2.5 text-sm font-bold text-[#26190a] transition hover:bg-[#ffd18a] disabled:cursor-not-allowed disabled:opacity-60"
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
