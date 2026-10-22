import Link from "next/link";
import legalData from "@/data/legal-pages.json";

export default function TermsAndConditionsPage() {
  const doc = legalData["terms/en"];

  return (
    <section className="nk-legal-section">
      <div>
        <div className="nk-eyebrow">
          <span className="nk-eyebrow-num">LEGAL</span>
          <span>NEWBEE · BEEYONDAPPS TECHNOLOGY LTD. · TERMS OF SERVICE</span>
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
              Beeyondapps Technology Ltd.
              <br />
              Istanbul &amp; Frankfurt am Main
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
              <Link href="/privacy">Privacy Policy →</Link>
              <Link href="/contact">Contact &amp; Support →</Link>
            </div>
          </div>
        </aside>

        <div>
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
