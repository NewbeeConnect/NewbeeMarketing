"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NewbeeLogoMark } from "./Marks";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="nk-header">
      <div className="nk-header-bar">
        <Link href="/" className="nk-brand" onClick={closeMenu}>
          <NewbeeLogoMark size={28} />
          <span className="nk-brand-wordmark">
            newbee<span className="nk-brand-dot">.</span>
          </span>
          <span className="nk-brand-tag">Diaspora Super-App</span>
        </Link>

        <nav className="nk-nav" aria-label="Main navigation">
          <Link href="/#features">Platform</Link>
          <Link
            href="/communities"
            className={pathname === "/communities" ? "active" : ""}
          >
            Communities
          </Link>
          <Link
            href="/businesses"
            className={pathname === "/businesses" ? "active" : ""}
          >
            Experts &amp; Partners
          </Link>
          <Link
            href="/about"
            className={pathname === "/about" ? "active" : ""}
          >
            About
          </Link>
          <Link
            href="/privacy"
            className={
              pathname?.startsWith("/privacy") ||
              pathname?.startsWith("/termsandconditions")
                ? "active"
                : ""
            }
          >
            Legal
          </Link>
          <Link
            href="/contact"
            className={pathname === "/contact" ? "active" : ""}
          >
            Contact
          </Link>
        </nav>

        <div className="nk-header-actions">
          <a
            href="https://apps.apple.com/app/newbee/id6474511885"
            target="_blank"
            rel="noopener noreferrer"
            className="nk-header-ghost"
          >
            iOS App ↗
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.beeyondapps.newbee"
            target="_blank"
            rel="noopener noreferrer"
            className="nk-header-ghost"
          >
            Android ↗
          </a>
          <a
            href="https://expert.newbeeapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nk-header-ghost"
          >
            Expert Portal ↗
          </a>
          <a
            href="https://app.newbeeapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nk-header-ghost nk-header-ghost-primary"
          >
            <span className="nk-header-cta-dot" />
            Open Web App ↗
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          className="nk-menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="nk-mobile-drawer"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <span className="nk-menu-toggle-label">
            {menuOpen ? "Close" : "Menu"}
          </span>
          <span className={`nk-menu-icon ${menuOpen ? "open" : ""}`} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Mobile Compact Quick-Launch Bar */}
      <div className="nk-mobile-apps-bar" aria-label="Direct platform links">
        <a
          href="https://app.newbeeapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="nk-mobile-app-pill nk-mobile-app-pill-primary"
        >
          <span className="nk-header-cta-dot" />
          Web App ↗
        </a>
        <a
          href="https://apps.apple.com/app/newbee/id6474511885"
          target="_blank"
          rel="noopener noreferrer"
          className="nk-mobile-app-pill"
        >
          iOS ↗
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.beeyondapps.newbee"
          target="_blank"
          rel="noopener noreferrer"
          className="nk-mobile-app-pill"
        >
          Android ↗
        </a>
        <a
          href="https://expert.newbeeapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="nk-mobile-app-pill"
        >
          Experts ↗
        </a>
      </div>

      {/* Expandable Mobile Navigation Drawer */}
      {menuOpen && (
        <div id="nk-mobile-drawer" className="nk-mobile-drawer">
          <div className="nk-mobile-drawer-inner">
            <div className="nk-mobile-drawer-section">
              <div className="nk-mobile-drawer-label">Navigation</div>
              <div className="nk-mobile-drawer-links">
                <Link href="/#features" onClick={closeMenu}>
                  <span>Platform Features</span>
                  <span>→</span>
                </Link>
                <Link href="/communities" onClick={closeMenu}>
                  <span>Communities &amp; City Leads</span>
                  <span>→</span>
                </Link>
                <Link href="/businesses" onClick={closeMenu}>
                  <span>Experts &amp; Partners</span>
                  <span>→</span>
                </Link>
                <Link href="/about" onClick={closeMenu}>
                  <span>About Newbee</span>
                  <span>→</span>
                </Link>
                <Link href="/privacy" onClick={closeMenu}>
                  <span>Privacy &amp; KVKK</span>
                  <span>→</span>
                </Link>
                <Link href="/termsandconditions" onClick={closeMenu}>
                  <span>Terms &amp; Conditions</span>
                  <span>→</span>
                </Link>
                <Link href="/contact" onClick={closeMenu}>
                  <span>Contact &amp; Support</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="nk-mobile-drawer-section">
              <div className="nk-mobile-drawer-label">Get Newbee</div>
              <div className="nk-mobile-drawer-apps">
                <a
                  href="https://app.newbeeapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  <strong>Newbee Web App ↗</strong>
                  <span>app.newbeeapp.com</span>
                </a>
                <a
                  href="https://apps.apple.com/app/newbee/id6474511885"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  <strong>App Store (iOS) ↗</strong>
                  <span>iPhone &amp; iPad</span>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.beeyondapps.newbee"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  <strong>Google Play ↗</strong>
                  <span>Android Devices</span>
                </a>
                <a
                  href="https://expert.newbeeapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  <strong>Expert Portal ↗</strong>
                  <span>expert.newbeeapp.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
