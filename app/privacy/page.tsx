"use client";

import { useState } from "react";
import Link from "next/link";
import legalData from "@/data/legal-pages.json";

type DocKey =
  | "privacy/en"
  | "kvkk/en"
  | "privacy/tr"
  | "kvkk/tr"
  | "privacy/de"
  | "kvkk/de";

const TABS: { key: DocKey; label: string }[] = [
  { key: "privacy/en", label: "Privacy Policy (EN)" },
  { key: "kvkk/en", label: "KVKK Clarification (EN)" },
  { key: "privacy/tr", label: "Gizlilik Politikası (TR)" },
  { key: "kvkk/tr", label: "KVKK Aydınlatma Metni (TR)" },
  { key: "privacy/de", label: "Datenschutzerklärung (DE)" },
  { key: "kvkk/de", label: "KVKK Datenschutzhinweis (DE)" },
];

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState<DocKey>("privacy/en");
  const doc = legalData[activeTab];

  return (
    <section className="nk-legal-section">
      <div>
        <div className="nk-eyebrow">
          <span className="nk-eyebrow-num">LEGAL</span>
          <span>
            NEWBEE · BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ · PRIVACY &amp; KVKK
            CENTER
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
            <div className="nk-legal-meta-label">DATA CONTROLLER</div>
            <div className="nk-legal-meta-val">
              BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ
              <br />
              Sancaktepe / İstanbul, Türkiye
            </div>
          </div>
          <div>
            <div className="nk-legal-meta-label">PRIVACY &amp; DPO CONTACT</div>
            <div className="nk-legal-meta-val">
              <a href="mailto:privacy@beeyondapps.com">
                privacy@beeyondapps.com
              </a>
            </div>
          </div>
          <div>
            <div className="nk-legal-meta-label">RELATED DOCUMENTS</div>
            <div
              className="nk-legal-meta-val"
              style={{ display: "grid", gap: 6, marginTop: 4 }}
            >
              <Link href="/termsandconditions">
                Newbee Terms &amp; Conditions →
              </Link>
              <Link href="/contact?topic=deletion">
                Account &amp; Data Deletion Request →
              </Link>
            </div>
          </div>
        </aside>

        <div>
          <div
            className="nk-legal-tabs"
            role="tablist"
            aria-label="Language and Document Selector"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={activeTab === t.key}
                className={`nk-legal-tab ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
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
