import type { Metadata } from "next";
import Link from "next/link";
import {
  HandDrawnUnderline,
  ArrowUpRightBadge,
  ArrowUpRightDarkBadge,
} from "@/components/Marks";

export const metadata: Metadata = {
  title: "About Newbee — Story, Founders & Institutional Backing",
  description:
    "Learn how Newbee grew from a newcomer experience in Frankfurt am Main into an award-winning diaspora super-app backed by Frankfurt School Accelerator, Hessen Ideen, and Google for Startups.",
};

export default function AboutPage() {
  return (
    <>
      <section className="nk-hero">
        <div className="nk-hero-top">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-dot nk-pulse" />
            <span>About Newbee · From &ldquo;Help?!&rdquo; to &ldquo;Heeey!&rdquo;</span>
          </div>

          <h1 className="nk-h1">
            Built by expats who lived the{" "}
            <HandDrawnUnderline>relocation journey</HandDrawnUnderline>{" "}
            <span className="nk-accent">first-hand.</span>
          </h1>

          <p className="nk-lead">
            Moving to a new country is one of life&apos;s biggest transitions.
            Between residence permits, housing searches, tax forms, and finding
            your social circle in a new city, the first months abroad often
            start with <strong>&ldquo;Help?!&rdquo;</strong>. We built{" "}
            <strong>Newbee</strong> so that every newcomer can quickly reach{" "}
            <strong>&ldquo;Heeey!&rdquo;</strong> — feeling informed, supported,
            and genuinely at home.
          </p>
        </div>

        <div className="nk-blueprint-strip">
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">01 / Origin</span>
            <span className="nk-blueprint-val">Frankfurt am Main</span>
            <span className="nk-blueprint-sub">
              Conceived in Germany&apos;s most international financial and
              diaspora hub.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">02 / Award</span>
            <span className="nk-blueprint-val">€20,000 1st Prize</span>
            <span className="nk-blueprint-sub">
              First-place winner at the Frankfurt School of Finance &amp;
              Management Accelerator Final Pitch.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">03 / Scholarship</span>
            <span className="nk-blueprint-val">Hessen Ideen</span>
            <span className="nk-blueprint-sub">
              Backed by the State of Hesse&apos;s flagship entrepreneurship
              program.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">04 / Studio</span>
            <span className="nk-blueprint-val">Beeyondapps</span>
            <span className="nk-blueprint-sub">
              Developed and operated by BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ.
            </span>
          </div>
        </div>
      </section>

      {/* MISSION & PRINCIPLES */}
      <section className="nk-section">
        <div className="nk-section-header">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-num">01</span>
            <span>Our Mission &amp; Design Principles</span>
          </div>
          <h2 className="nk-h2">
            Why we reimagined{" "}
            <HandDrawnUnderline>diaspora communities</HandDrawnUnderline> from
            the ground up.
          </h2>
        </div>

        <div className="nk-editorial-grid-3">
          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">01 · Signal Over Noise</span>
              <h3 className="nk-editorial-title">
                Structured Knowledge Instead of Chaotic Feeds
              </h3>
              <p className="nk-editorial-body">
                Traditional social media groups bury critical relocation advice
                under repetitive posts and unverified rumors. Newbee organizes
                conversations by city and topic, pairing peer experience with
                pinned guides and verified professional answers.
              </p>
            </div>
            <div className="nk-editorial-foot">
              City-Filtered Feeds · Curated Guides
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">02 · Online to Offline</span>
              <h3 className="nk-editorial-title">
                Real-World Belonging Through Local Events
              </h3>
              <p className="nk-editorial-body">
                True integration happens face-to-face. From intimate city coffee
                meetups hosted by City Leads to major cultural concerts and
                comedy tours, Newbee makes discovering and attending local
                events effortless.
              </p>
            </div>
            <div className="nk-editorial-foot">
              City Lead Mixers · Instant QR Tickets
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">03 · Privacy &amp; Trust</span>
              <h3 className="nk-editorial-title">
                European Data Protection &amp; Verified Identity
              </h3>
              <p className="nk-editorial-body">
                Engineered with strict GDPR and KVKK compliance, transparent
                moderation standards, and credential verification for experts —
                ensuring a respectful, spam-free environment for every member.
              </p>
            </div>
            <div className="nk-editorial-foot">
              GDPR &amp; KVKK Compliant · Moderated Spaces
            </div>
          </div>
        </div>
      </section>

      {/* CO-FOUNDERS */}
      <section className="nk-section" style={{ paddingTop: 16 }}>
        <div className="nk-section-header">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-num">02</span>
            <span>Leadership &amp; Founding Team</span>
          </div>
          <h2 className="nk-h2">
            Founded by{" "}
            <HandDrawnUnderline>Çağlar Biber</HandDrawnUnderline> &amp;{" "}
            <span className="nk-accent">Hande Turan.</span>
          </h2>
          <p className="nk-lead">
            Combining architectural systems thinking, full-stack product
            engineering, and international marketing strategy across Frankfurt
            am Main and İstanbul.
          </p>
        </div>

        <div className="nk-founders-grid">
          <div className="nk-founder-card">
            <div>
              <div className="nk-founder-head">
                <div className="nk-founder-monogram">ÇB</div>
                <div>
                  <h3 className="nk-founder-name">Çağlar Biber</h3>
                  <div className="nk-founder-role">
                    Co-Founder · Product Architecture &amp; Engineering
                  </div>
                  <div className="nk-founder-loc">
                    Frankfurt am Main, Germany
                  </div>
                </div>
              </div>
              <p className="nk-founder-bio">
                Architect and product builder based in Frankfurt am Main. After
                experiencing the fragmented information landscape facing
                newcomers in Germany first-hand, Çağlar co-founded Newbee and
                Beeyondapps to engineer structured, design-led digital platforms
                for international communities.
              </p>
            </div>
            <div className="nk-tag-row">
              <span className="nk-tag-chip">Product Architecture</span>
              <span className="nk-tag-chip">Mobile &amp; Web Systems</span>
              <span className="nk-tag-chip">Frankfurt am Main</span>
            </div>
          </div>

          <div className="nk-founder-card">
            <div>
              <div className="nk-founder-head">
                <div className="nk-founder-monogram nk-founder-monogram-mint">
                  HT
                </div>
                <div>
                  <h3 className="nk-founder-name">Hande Turan</h3>
                  <div className="nk-founder-role">
                    Co-Founder · Growth, Brand &amp; Community Operations
                  </div>
                  <div className="nk-founder-loc">
                    Frankfurt am Main &amp; İstanbul
                  </div>
                </div>
              </div>
              <p className="nk-founder-bio">
                Growth and communications strategist leading Newbee&apos;s city
                expansion, City Lead network, cultural event partnerships, and
                institutional relationships across Germany. Hande drives the
                human-centered community culture behind &ldquo;From Help?! to
                Heeey!&rdquo;.
              </p>
            </div>
            <div className="nk-tag-row">
              <span className="nk-tag-chip">Community Ecosystem</span>
              <span className="nk-tag-chip">Brand &amp; Partnerships</span>
              <span className="nk-tag-chip">City Lead Network</span>
            </div>
          </div>
        </div>
      </section>

      <section className="nk-closing">
        <div className="nk-closing-inner">
          <div className="nk-eyebrow" style={{ justifyContent: "center" }}>
            <span className="nk-eyebrow-dot nk-pulse" />
            <span>Connect With Us</span>
          </div>
          <h2 className="nk-closing-h2">
            Have a question or{" "}
            <HandDrawnUnderline>partnership idea</HandDrawnUnderline>?
          </h2>
          <p className="nk-closing-sub">
            Get in touch with our team regarding community initiatives, press
            inquiries, expert onboarding, or platform support.
          </p>
          <div className="nk-closing-actions">
            <Link href="/contact" className="nk-btn-coral">
              <span>Contact the Newbee Team</span>
              <ArrowUpRightBadge />
            </Link>
            <a
              href="https://www.beeyondapps.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-ink"
            >
              <span>Visit Beeyondapps Studio</span>
              <ArrowUpRightDarkBadge />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
