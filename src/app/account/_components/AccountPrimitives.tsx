"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function SectionHeader({ title, description }: { title: string; description: string }) {
    return (
        <header className="account-section-header">
            <h1>{title}</h1>
            <p>{description}</p>
        </header>
    );
}

export function FieldRow({ label, value, managed = false }: { label: string; value: ReactNode; managed?: boolean }) {
    return (
        <div className="account-field-row">
            <dt>{label}</dt>
            <dd>
                {renderAccountValue(value)}
                {managed ? <span className="account-managed">Managed</span> : null}
            </dd>
        </div>
    );
}

function renderAccountValue(value: ReactNode): ReactNode {
    if (value === null || value === undefined || typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (typeof value === "object" && !Array.isArray(value)) {
        const candidate = value as { message?: unknown; code?: unknown; name?: unknown };
        if (typeof candidate.message === "string") return candidate.message;
        if (typeof candidate.code === "string") return candidate.code;
        if (typeof candidate.name === "string") return candidate.name;
        return "Unavailable";
    }

    return value;
}

export function AccountPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <section className={`account-panel ${className}`}>{children}</section>;
}

type AccountButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    variant?: "primary" | "secondary" | "tertiary" | "danger";
    className?: string;
};

export function AccountButton({
    children,
    variant = "secondary",
    className = "",
    ...props
}: AccountButtonProps) {
    return (
        <button
            {...props}
            className={`account-button account-button-${variant} ${className}`.trim()}
        >
            {children}
        </button>
    );
}

export function AccountToggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
    return (
        <button type="button" role="switch" aria-checked={checked} className="flex items-center gap-2 text-sm text-[var(--fg)]" onClick={() => onChange(!checked)}>
            <span className={`account-toggle ${checked ? "account-toggle-on" : ""}`}><span /></span>
            {label}
        </button>
    );
}
