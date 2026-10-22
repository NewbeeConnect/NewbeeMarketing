"use client";

import { useState } from "react";
import Link from "next/link";
import legalData from "@/data/legal-pages.json";

type TermsKey = "terms/en" | "terms/tr" | "terms/de";

export default function TermsAndConditionsPage() {
  const [activeTab, setActiveTab] = useState<TermsKey>("terms/en");
  const doc = legalData[activeTab];

  return (
    <section className="nk-legal-section">
      <div>
        <div className="nk-eyebrow">
          <span className="nk-eyebrow-num">LEGAL</span>
          <span>
            NEWBEE · BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ · TERMS OF SERVICE
          </span>
        </div>
        <h1 className="nk-h2">{doc.title}</h1>
      </div>

      <div className="nk-legal-grid">
        <aside className="nk-legal-aside">
          <div>
            <div className="nk-legal-meta-label">LAST UPDATED</div>
            <div className="nk-legal-meta-val">25 September 2026</div>
          </div>
          <div>
            <div className="nk-legal-meta-label">OPERATING ENTITY</div>
            <div className="nk-legal-meta-val">
              BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ
              <br />
              Sancaktepe / İstanbul, Türkiye
            </div>
          </div>
          <div>
            <div className="nk-legal-meta-label">SUPPORT CONTACT</div>
            <div className="nk-legal-meta-val">
              <a href="mailto:info@beeyondapps.com">info@beeyondapps.com</a>
            </div>
          </div>
          <div>
            <div className="nk-legal-meta-label">RELATED DOCUMENTS</div>
            <div
              className="nk-legal-meta-val"
              style={{ display: "grid", gap: 6, marginTop: 4 }}
            >
              <Link href="/privacy">Privacy Policy &amp; KVKK →</Link>
              <Link href="/contact">Contact &amp; Support →</Link>
            </div>
          </div>
        </aside>

        <div>
          <div
            className="nk-legal-tabs"
            role="tablist"
            aria-label="Language Selector"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "terms/en"}
              className={`nk-legal-tab ${activeTab === "terms/en" ? "active" : ""}`}
              onClick={() => setActiveTab("terms/en")}
            >
              Terms &amp; Conditions (EN)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "terms/tr"}
              className={`nk-legal-tab ${activeTab === "terms/tr" ? "active" : ""}`}
              onClick={() => setActiveTab("terms/tr")}
            >
              Kullanım Koşulları (TR)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "terms/de"}
              className={`nk-legal-tab ${activeTab === "terms/de" ? "active" : ""}`}
              onClick={() => setActiveTab("terms/de")}
            >
              AGB (DE)
            </button>
          </div>

          <article className="nk-legal-article">
            {doc.sections.map((section, idx) => (
              <section key={idx} style={{ marginBottom: 28 }}>
                <h2>{section.title}</h2>
                <div className="nk-legal-prose">{section.body}</div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </section>
  );
}
