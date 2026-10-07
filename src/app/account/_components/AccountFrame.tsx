"use client";

import { CheFuUserDropdown, type CheFuUserDropdownUser } from "chefu-ui";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { navItems } from "./account-data";
import { Toggle } from "./Toggle";

const THEME_STORAGE_KEY = "chefu-account-theme";

type AccountFrameProps = {
  activeSection: string;
  children: ReactNode;
  isSigningOut: boolean;
  onSelectSection: (id: string) => void;
  onSignOut: () => void;
  user: CheFuUserDropdownUser;
};

export function AccountFrame(props: AccountFrameProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    setDarkMode(window.localStorage.getItem(THEME_STORAGE_KEY) === "dark");
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (!themeLoaded) {
      return;
    }
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [darkMode, themeLoaded]);
  const navigate = (id: string) => {
    props.onSelectSection(id);
    setMobileNavOpen(false);
  };

  return (
    <div className="account-ui account-shell">
      <header className="account-mobile-header">
        <Brand compact />
        <div className="flex items-center gap-2">
         
          <CheFuUserDropdown
            accountHref="/account"
            onSignOut={props.onSignOut}
            pendingSignOut={props.isSigningOut}
            user={props.user}
            variant="cyan"
          />
          <button
            type="button"
            className="account-icon-button"
            aria-label={
              mobileNavOpen ? "Close navigation menu" : "Open navigation menu"
            }
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      <div className="account-menu">
        <CheFuUserDropdown
          accountHref="/account"
          onSignOut={props.onSignOut}
          pendingSignOut={props.isSigningOut}
          user={props.user}
          variant="cyan"
        />
      </div>

      <aside
        className={`account-sidebar ${mobileNavOpen ? "account-sidebar-open" : ""}`}
      >
        <div className="account-sidebar-brand">
          <Brand />
          <button
            type="button"
            className="account-icon-button md:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <nav
          className="account-sidebar-nav"
          aria-label="Account settings navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`account-nav-item ${props.activeSection === item.id ? "account-nav-item-active" : ""}`}
              aria-current={
                props.activeSection === item.id ? "page" : undefined
              }
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="account-theme-row">
          <span>Dark mode</span>
          <Toggle checked={darkMode} onChange={setDarkMode} id="theme-toggle" />
        </div>
      </aside>

      <main className="account-main">{props.children}</main>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/account" className="flex items-center gap-3">
      <span
        role="img"
        aria-label="CHEFU Technologies"
        className={`block shrink-0 bg-[var(--fg)] ${compact ? "h-5" : "h-6"} aspect-[512/359]`}
        style={{
          maskImage: "url(/ct-logo.png)",
          WebkitMaskImage: "url(/ct-logo.png)",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
      {!compact ? (
        <span>
          <span className="block text-[13px] font-semibold tracking-wide text-[var(--fg)]">
            My Account
          </span>
          <span className="block text-[11px] text-[var(--fg-muted)]">
            Account settings
          </span>
        </span>
      ) : (
        <span className="text-sm font-semibold text-[var(--fg)]">
          My Account
        </span>
      )}
    </Link>
  );
}
