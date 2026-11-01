export function AccountHomeSkeleton() {
    return (
        <section className="account-skeleton-page" aria-label="Loading account overview">
            <div className="account-skeleton-heading">
                <span className="account-skeleton-line account-skeleton-title" />
                <span className="account-skeleton-line account-skeleton-description" />
            </div>

            <div className="account-skeleton-identity">
                <span className="account-skeleton-avatar" />
                <div className="account-skeleton-identity-copy">
                    <span className="account-skeleton-line account-skeleton-name" />
                    <span className="account-skeleton-line account-skeleton-email" />
                    <span className="account-skeleton-status" />
                </div>
                <span className="account-skeleton-button" />
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
        </section>
    );
}
