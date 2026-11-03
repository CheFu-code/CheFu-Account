export function AccountChooserSkeleton() {
    return (
        <div role="status" aria-live="polite">
            <span className="sr-only">Loading your accounts…</span>
            <div aria-hidden="true" className="space-y-2 motion-safe:animate-pulse">
                {[0, 1, 2].map(row => (
                    <div key={row} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
                        <div className="size-10 shrink-0 rounded-full bg-[var(--border)]" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className={`h-3.5 rounded bg-[var(--border)] ${row === 1 ? "w-1/2" : "w-2/3"}`} />
                            <div className="h-3 w-4/5 rounded bg-[var(--border)]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
