"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NewbeeLogoMark } from "./Marks";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [progressW, setProgressW] = useState("0%");

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const updateProgress = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const ratio = Math.min(1, Math.max(0, window.scrollY / max));
      setProgressW(`${(ratio * 100).toFixed(1)}%`);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [pathname]);

  return (
    <header className="nk-header">
      <div className="nk-header-bar">
        <Link href="/#start" className="nk-brand" onClick={closeMenu}>
          <NewbeeLogoMark size={28} />
          <span className="nk-brand-wordmark">
            newbee<span className="nk-brand-dot">.</span>
          </span>
          <span className="nk-brand-tag">Living abroad, simplified</span>
        </Link>

        <nav className="nk-nav" aria-label="Slide navigation">
          <Link href="/#ask">
            <span className="nk-nav-num">01</span> Ask Questions
          </Link>
          <Link href="/#events">
            <span className="nk-nav-num">02</span> Organize Events
          </Link>
          <Link href="/#meet">
            <span className="nk-nav-num">03</span> Meet People
          </Link>
          <Link href="/#get-started">Get the App</Link>
        </nav>

        <div className="nk-header-actions">
          <a
            href="https://app.newbeeapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nk-header-ghost"
          >
            <span className="nk-header-cta-dot" />
            Continue on Web ↗
          </a>
          <Link
            href="/download"
            className="nk-header-ghost nk-header-ghost-primary"
          >
            Download App ↓
          </Link>
        </div>

        <button
          type="button"
          className="nk-menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="nk-mobile-drawer"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
        >
          <span className="nk-menu-toggle-label">
            {menuOpen ? "Close" : "Menu"}
          </span>
          <span
            className={`nk-menu-icon ${menuOpen ? "open" : ""}`}
            aria-hidden="true"
          >
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Scroll progress bar (neoklinik.io style) */}
      <div
        aria-hidden="true"
        className="nk-scroll-progress"
        style={{ width: progressW }}
      />

      {menuOpen && (
        <div id="nk-mobile-drawer" className="nk-mobile-drawer">
          <div className="nk-mobile-drawer-inner">
            <div className="nk-mobile-drawer-section">
              <div className="nk-mobile-drawer-label">Slides</div>
              <div className="nk-mobile-drawer-links">
                <Link href="/#start" onClick={closeMenu}>
                  <span>00 · Overview</span>
                  <span>→</span>
                </Link>
                <Link href="/#ask" onClick={closeMenu}>
                  <span>01 · Ask Questions</span>
                  <span>→</span>
                </Link>
                <Link href="/#events" onClick={closeMenu}>
                  <span>02 · Organize Events</span>
                  <span>→</span>
                </Link>
                <Link href="/#meet" onClick={closeMenu}>
                  <span>03 · Meet New People</span>
                  <span>→</span>
                </Link>
                <Link href="/#get-started" onClick={closeMenu}>
                  <span>04 · Download &amp; Web App</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="nk-mobile-drawer-section">
              <div className="nk-mobile-drawer-label">Open Newbee</div>
              <div className="nk-mobile-drawer-apps">
                <a
                  href="https://app.newbeeapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  <strong>Continue on Web ↗</strong>
                  <span>app.newbeeapp.com</span>
                </a>
                <a
                  href="https://apps.apple.com/de/app/newbee-connect/id6474511885?l=en-GB"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  <strong>App Store (iOS) ↗</strong>
                  <span>Download for iPhone</span>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.beeyondapps.newbee"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  <strong>Google Play ↗</strong>
                  <span>Download for Android</span>
                </a>
                <Link href="/privacy" onClick={closeMenu}>
                  <strong>Privacy &amp; Terms</strong>
                  <span>Legal Information</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
