export function AccountHomeSkeleton() {
    return (
        <section className="account-skeleton-shell" aria-label="Loading account overview">
            <header className="account-skeleton-mobile-header">
                <span className="account-skeleton-brand account-skeleton-line" />
                <span className="account-skeleton-menu account-skeleton-line" />
            </header>

            <aside className="account-skeleton-sidebar">
                <div className="account-skeleton-sidebar-brand">
                    <span className="account-skeleton-logo account-skeleton-line" />
                    <div>
                        <span className="account-skeleton-line account-skeleton-brand-title" />
                        <span className="account-skeleton-line account-skeleton-brand-subtitle" />
                    </div>
                </div>
                <nav className="account-skeleton-nav" aria-hidden="true">
                    {["overview", "personal", "security", "privacy", "notifications", "apps"].map((item, index) => (
                        <span
                            className={`account-skeleton-nav-item account-skeleton-line ${index === 0 ? "account-skeleton-nav-item-active" : ""}`}
                            key={item}
                        />
                    ))}
                </nav>
                <div className="account-skeleton-theme">
                    <span className="account-skeleton-line account-skeleton-theme-label" />
                    <span className="account-skeleton-toggle account-skeleton-line" />
                </div>
                <div className="account-skeleton-switcher">
                    <span className="account-skeleton-avatar account-skeleton-line" />
                    <div>
                        <span className="account-skeleton-line account-skeleton-account-label" />
                        <span className="account-skeleton-line account-skeleton-account-email" />
                    </div>
                    <span className="account-skeleton-chevron account-skeleton-line" />
                </div>
                <div className="account-skeleton-signout account-skeleton-line" />
            </aside>

            <main className="account-skeleton-main">
                <div className="account-skeleton-page">
                    <div className="account-skeleton-heading">
                        <span className="account-skeleton-line account-skeleton-title" />
                        <span className="account-skeleton-line account-skeleton-description" />
                    </div>

                    <div className="account-skeleton-identity">
                        <span className="account-skeleton-avatar account-skeleton-line" />
                        <div className="account-skeleton-identity-copy">
                            <span className="account-skeleton-line account-skeleton-name" />
                            <span className="account-skeleton-line account-skeleton-email" />
                            <span className="account-skeleton-status account-skeleton-line" />
                        </div>
                        <span className="account-skeleton-button account-skeleton-line" />
                    </div>

                    <div className="account-skeleton-divider" />
                    <span className="account-skeleton-line account-skeleton-section-title" />

                    <div className="account-skeleton-panel">
                        {["full-name", "email", "country", "status", "last-sign-in", "created"].map((item) => (
                            <div className="account-skeleton-field" key={item}>
                                <span className="account-skeleton-line account-skeleton-label" />
                                <span className="account-skeleton-line account-skeleton-value" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </section>
    );
}
