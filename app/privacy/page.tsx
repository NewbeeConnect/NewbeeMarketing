"use client";

import { useState } from "react";
import Link from "next/link";
import legalData from "@/data/legal-pages.json";

type DocKey = "privacy/en" | "kvkk/en";

const TABS: { key: DocKey; label: string }[] = [
  { key: "privacy/en", label: "Privacy Policy" },
  { key: "kvkk/en", label: "Data Protection Notice (GDPR / KVKK)" },
];

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState<DocKey>("privacy/en");
  const doc = legalData[activeTab];

  return (
    <section className="nk-legal-section">
      <div>
        <div className="nk-eyebrow">
          <span className="nk-eyebrow-num">LEGAL</span>
          <span>NEWBEE · BEEYONDAPPS TECHNOLOGY LTD. · PRIVACY CENTER</span>
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
              Beeyondapps Technology Ltd.
              <br />
              Istanbul &amp; Frankfurt am Main
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
            aria-label="Document Selector"
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
