import Link from "next/link";
import {
  NewbeeLogoMark,
  HandDrawnUnderline,
  ArrowUpRightBadge,
  ArrowUpRightDarkBadge,
} from "@/components/Marks";

export default function HomePage() {
  return (
    <>
      {/* ====================================================================
          HERO — ARCHITECTURAL GRID & DOWNLOAD CTAS
          ==================================================================== */}
      <section className="nk-hero">
        <div className="nk-hero-top">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-dot nk-pulse" />
            <span>
              From &ldquo;Help?!&rdquo; to &ldquo;Heeey!&rdquo; · Diaspora &amp;
              Expat Super-App
            </span>
          </div>

          <h1 className="nk-h1">
            Your life abroad,{" "}
            <HandDrawnUnderline>connected</HandDrawnUnderline> in one{" "}
            <span className="nk-accent">trusted community.</span>
          </h1>

          <p className="nk-lead">
            Moving to a new country shouldn&apos;t mean navigating bureaucracy,
            housing, and social life across dozens of scattered chat groups.{" "}
            <strong>Newbee</strong> brings together city communities, cultural
            events with instant QR ticketing, relocation guides, and verified
            native-speaking experts across Germany — on{" "}
            <strong>iOS, Android, and Web</strong>.
          </p>

          <div className="nk-actions">
            <a
              href="https://apps.apple.com/app/newbee/id6474511885"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-coral"
            >
              <span>Download on App Store</span>
              <ArrowUpRightBadge />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.beeyondapps.newbee"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-ink"
            >
              <span>Get it on Google Play</span>
              <ArrowUpRightDarkBadge />
            </a>
            <a
              href="https://app.newbeeapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-outline"
            >
              <span>Open Web App (app.newbeeapp.com) ↗</span>
            </a>
          </div>
        </div>

        {/* Architectural 4-Cell Blueprint Metrics Bar */}
        <div className="nk-blueprint-strip">
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">01 / Platforms</span>
            <span className="nk-blueprint-val">iOS · Android · Web</span>
            <span className="nk-blueprint-sub">
              Native mobile apps synchronized with our full web platform at
              app.newbeeapp.com.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">02 / City Hubs</span>
            <span className="nk-blueprint-val">Germany-Wide</span>
            <span className="nk-blueprint-sub">
              Active local communities in Frankfurt, Berlin, Munich, Hamburg,
              Cologne, Düsseldorf &amp; Stuttgart.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">03 / Recognition</span>
            <span className="nk-blueprint-val">€20K 1st Prize</span>
            <span className="nk-blueprint-sub">
              Frankfurt School Accelerator Winner · Backed by Hessen Ideen &amp;
              Google for Startups.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">04 / Verified Network</span>
            <span className="nk-blueprint-val">Expert Q&amp;A</span>
            <span className="nk-blueprint-sub">
              Direct answers from vetted legal, tax, housing, and relocation
              specialists in your own language.
            </span>
          </div>
        </div>
      </section>

      {/* ====================================================================
          01 / CORE PLATFORM PILLARS — ARCHITECTURAL SPLIT SHOWCASES
          ==================================================================== */}
      <section id="features" className="nk-section">
        <div className="nk-section-header">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-num">01</span>
            <span>Platform Architecture · Four Core Pillars</span>
          </div>
          <h2 className="nk-h2">
            Everything you need to{" "}
            <HandDrawnUnderline>feel at home</HandDrawnUnderline> in your city.
          </h2>
          <p className="nk-lead">
            Newbee replaces fragmented social media groups and unverified advice
            with structured local hubs, real-world events, and verified
            professional guidance.
          </p>
        </div>

        <div className="nk-products-list">
          {/* PILLAR 01 — CITY & INTEREST COMMUNITIES */}
          <article className="nk-product-frame">
            <div className="nk-product-copy">
              <div>
                <div className="nk-product-topmeta">
                  <span className="nk-product-index">
                    <span className="nk-eyebrow-num">01.1</span>
                    <span>City &amp; Topic Hubs</span>
                  </span>
                  <span className="nk-product-pill nk-product-pill-coral">
                    Live on iOS · Android · Web
                  </span>
                </div>

                <div className="nk-product-title-row">
                  <div className="nk-product-icon" aria-hidden="true">
                    <NewbeeLogoMark size={50} />
                  </div>
                  <h3 className="nk-product-name">Communities &amp; Feeds</h3>
                </div>

                <div className="nk-product-tagline">
                  Structured city circles and interest groups led by local City
                  Leads.
                </div>

                <p className="nk-product-desc">
                  Join your city&apos;s dedicated hub — from Frankfurt am Main
                  and Berlin to Munich, Hamburg, and Cologne — alongside topic
                  circles for newcomers, families, tech professionals, and arts
                  lovers. Ask questions, run community polls, and read curated
                  relocation guides without losing important threads in endless
                  chat scroll.
                </p>

                <div className="nk-feature-grid">
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Dedicated city feeds for major German metropolitan regions
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Rich posts with photo galleries, interactive polls &amp;
                      saved bookmarks
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Step-by-step relocation &amp; bureaucracy guides
                      (Anmeldung, visa, health insurance)
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Active moderation &amp; trusted community guidelines
                    </span>
                  </div>
                </div>
              </div>

              <div className="nk-product-links">
                <a
                  href="https://app.newbeeapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nk-pill-link nk-pill-link-primary"
                >
                  Explore Communities on Web ↗
                </a>
                <Link href="/communities" className="nk-pill-link">
                  City Lead Program →
                </Link>
              </div>
            </div>

            <div className="nk-product-stage">
              <div className="nk-stage-window">
                <div className="nk-stage-bar">
                  <div className="nk-stage-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>app.newbeeapp.com · city-hubs</span>
                </div>

                <div className="nk-stage-card nk-stage-card-coral">
                  <div className="nk-stage-card-head">
                    <span>Frankfurt am Main Hub</span>
                    <span className="nk-stage-badge">Pinned Guide</span>
                  </div>
                  <div className="nk-stage-card-body">
                    First 30 Days in Frankfurt: Bürgeramt appointment tips,
                    RMV transit passes, family benefits, and neighborhood
                    recommendations curated by local members.
                  </div>
                </div>

                <div className="nk-stage-card">
                  <div className="nk-stage-card-head">
                    <span>Berlin · Newcomers &amp; Founders</span>
                    <span className="nk-stage-badge">Active Poll</span>
                  </div>
                  <div className="nk-stage-card-body">
                    Which topic should our next community workshop cover? Tax
                    filing (Steuererklärung) · Freelance Visa · Kita &amp;
                    School Enrollment.
                  </div>
                </div>

                <div className="nk-stage-card">
                  <div className="nk-stage-card-head">
                    <span>Munich &amp; NRW Circles</span>
                    <span className="nk-stage-badge">Daily Q&amp;A</span>
                  </div>
                  <div className="nk-stage-card-body">
                    Peer-to-peer recommendations for English- and
                    Turkish-speaking family doctors, sworn translators, and
                    local sports clubs.
                  </div>
                </div>
              </div>

              <div className="nk-stage-metrics">
                <div>
                  <div className="nk-stage-metric-val">30+ Hubs</div>
                  <div className="nk-stage-metric-lbl">City &amp; Topic Circles</div>
                </div>
                <div>
                  <div className="nk-stage-metric-val">Moderated</div>
                  <div className="nk-stage-metric-lbl">Safe &amp; Verified Space</div>
                </div>
                <div>
                  <div className="nk-stage-metric-val">Real-Time</div>
                  <div className="nk-stage-metric-lbl">Push &amp; Web Sync</div>
                </div>
              </div>
            </div>
          </article>

          {/* PILLAR 02 — CULTURAL EVENTS & QR TICKETING */}
          <article className="nk-product-frame">
            <div className="nk-product-copy">
              <div>
                <div className="nk-product-topmeta">
                  <span className="nk-product-index">
                    <span className="nk-eyebrow-num">01.2</span>
                    <span>Events &amp; Ticketing</span>
                  </span>
                  <span className="nk-product-pill nk-product-pill-mint">
                    Instant In-App QR Pass
                  </span>
                </div>

                <div className="nk-product-title-row">
                  <div className="nk-product-icon" aria-hidden="true">
                    <NewbeeLogoMark size={50} />
                  </div>
                  <h3 className="nk-product-name">
                    Local Events &amp; Meetups
                  </h3>
                </div>

                <div className="nk-product-tagline">
                  Turn online connections into real-world friendships across
                  Germany.
                </div>

                <p className="nk-product-desc">
                  Discover cultural concerts, stand-up comedy nights,
                  professional networking mixers, parent-child playdates, and
                  city coffee meetups near you. Register in one tap and access
                  your personal QR ticket directly inside the Newbee app — ready
                  for instant door check-in.
                </p>

                <div className="nk-feature-grid">
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Curated calendar of cultural concerts, theatre, comedy
                      &amp; workshops
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Instant in-app RSVP and unique QR code ticket generation
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Calendar export, venue maps, and attendee reminders
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Organizer tools for City Leads and cultural event partners
                    </span>
                  </div>
                </div>
              </div>

              <div className="nk-product-links">
                <a
                  href="https://apps.apple.com/app/newbee/id6474511885"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nk-pill-link nk-pill-link-primary"
                >
                  Get iOS App ↗
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.beeyondapps.newbee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nk-pill-link"
                >
                  Get Android App ↗
                </a>
                <Link href="/businesses" className="nk-pill-link">
                  Host an Event with Us →
                </Link>
              </div>
            </div>

            <div className="nk-product-stage">
              <div className="nk-stage-window">
                <div className="nk-stage-bar">
                  <div className="nk-stage-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>newbee://events · qr-ticket-engine</span>
                </div>

                <div className="nk-stage-card nk-stage-card-coral">
                  <div className="nk-stage-card-head">
                    <span>Newbee City Mixer · Frankfurt</span>
                    <span className="nk-stage-badge">QR Ticket Active</span>
                  </div>
                  <div className="nk-stage-card-body">
                    Evening networking &amp; newcomer welcome session · Instant
                    QR pass stored in your Newbee profile for fast venue entry.
                  </div>
                </div>

                <div className="nk-stage-card">
                  <div className="nk-stage-card-head">
                    <span>Cultural Stage · Concerts &amp; Comedy</span>
                    <span className="nk-stage-badge">Featured Tour</span>
                  </div>
                  <div className="nk-stage-card-body">
                    Never miss diaspora concerts, theatre performances, or
                    literary talks touring Berlin, Cologne, Munich, and
                    Stuttgart.
                  </div>
                </div>

                <div className="nk-stage-card">
                  <div className="nk-stage-card-head">
                    <span>Topical Workshops &amp; Webinars</span>
                    <span className="nk-stage-badge">Live Session</span>
                  </div>
                  <div className="nk-stage-card-body">
                    Interactive online and hybrid sessions on home buying in
                    Germany, tax classes, and freelance business setup.
                  </div>
                </div>
              </div>

              <div className="nk-stage-metrics">
                <div>
                  <div className="nk-stage-metric-val">1-Tap RSVP</div>
                  <div className="nk-stage-metric-lbl">In-App Registration</div>
                </div>
                <div>
                  <div className="nk-stage-metric-val">QR Pass</div>
                  <div className="nk-stage-metric-lbl">Door Check-In Ready</div>
                </div>
                <div>
                  <div className="nk-stage-metric-val">City-Filtered</div>
                  <div className="nk-stage-metric-lbl">Events Near You</div>
                </div>
              </div>
            </div>
          </article>

          {/* PILLAR 03 — VERIFIED NATIVE-SPEAKING EXPERTS */}
          <article className="nk-product-frame">
            <div className="nk-product-copy">
              <div>
                <div className="nk-product-topmeta">
                  <span className="nk-product-index">
                    <span className="nk-eyebrow-num">01.3</span>
                    <span>Verified Expert Network</span>
                  </span>
                  <span className="nk-product-pill nk-product-pill-coral">
                    expert.newbeeapp.com
                  </span>
                </div>

                <div className="nk-product-title-row">
                  <div className="nk-product-icon" aria-hidden="true">
                    <NewbeeLogoMark size={50} />
                  </div>
                  <h3 className="nk-product-name">
                    Verified Experts &amp; Q&amp;A
                  </h3>
                </div>

                <div className="nk-product-tagline">
                  Reliable answers from vetted professionals who speak your
                  language and know German regulations.
                </div>

                <p className="nk-product-desc">
                  High-stakes decisions — residence permits, tax declarations,
                  commercial contracts, real estate financing, and health
                  coverage — require qualified expertise, not guesswork. Newbee
                  connects users directly with verified professionals through
                  structured Category Q&amp;A and dedicated expert profiles.
                </p>

                <div className="nk-feature-grid">
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Verified specialists in Immigration Law, Tax, Mortgage,
                      Insurance &amp; Relocation
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Category-routed Q&amp;A where vetted experts publish
                      authoritative answers
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Dedicated web workspace at expert.newbeeapp.com for
                      participating professionals
                    </span>
                  </div>
                  <div className="nk-feature-item">
                    <span className="nk-feature-dot">✓</span>
                    <span>
                      Transparent credentials, spoken languages, and direct
                      consultation requests
                    </span>
                  </div>
                </div>
              </div>

              <div className="nk-product-links">
                <a
                  href="https://expert.newbeeapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nk-pill-link nk-pill-link-primary"
                >
                  Open Expert Portal ↗
                </a>
                <Link href="/businesses" className="nk-pill-link">
                  Apply as a Verified Expert →
                </Link>
              </div>
            </div>

            <div className="nk-product-stage">
              <div className="nk-stage-window">
                <div className="nk-stage-bar">
                  <div className="nk-stage-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>expert.newbeeapp.com · verified-qna</span>
                </div>

                <div className="nk-stage-card nk-stage-card-coral">
                  <div className="nk-stage-card-head">
                    <span>Residence &amp; Citizenship Law</span>
                    <span className="nk-stage-badge">Verified Badge</span>
                  </div>
                  <div className="nk-stage-card-body">
                    EU Blue Card transitions, family reunification timelines,
                    and dual citizenship requirements explained by licensed
                    legal specialists.
                  </div>
                </div>

                <div className="nk-stage-card">
                  <div className="nk-stage-card-head">
                    <span>Tax, Freelancing &amp; GmbH Setup</span>
                    <span className="nk-stage-badge">Expert Q&amp;A</span>
                  </div>
                  <div className="nk-stage-card-body">
                    Structured guidance on Steuerklassen, freelance registration
                    (Finanzamt), and cross-border taxation.
                  </div>
                </div>

                <div className="nk-stage-card">
                  <div className="nk-stage-card-head">
                    <span>Real Estate, Mortgages &amp; Insurance</span>
                    <span className="nk-stage-badge">Direct Connect</span>
                  </div>
                  <div className="nk-stage-card-body">
                    Compare statutory vs. private health insurance and navigate
                    property financing in Germany with bilingual advisors.
                  </div>
                </div>
              </div>

              <div className="nk-stage-metrics">
                <div>
                  <div className="nk-stage-metric-val">Vetted</div>
                  <div className="nk-stage-metric-lbl">Credential Checked</div>
                </div>
                <div>
                  <div className="nk-stage-metric-val">TR · EN · DE</div>
                  <div className="nk-stage-metric-lbl">Multilingual Support</div>
                </div>
                <div>
                  <div className="nk-stage-metric-val">Direct Q&amp;A</div>
                  <div className="nk-stage-metric-lbl">Topic-Routed Answers</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ====================================================================
          02 / ECOSYSTEM ROLES — COMMUNITIES, CITY LEADS & PARTNERS
          ==================================================================== */}
      <section className="nk-section" style={{ paddingTop: 24 }}>
        <div className="nk-section-header">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-num">02</span>
            <span>Who Newbee Is Built For</span>
          </div>
          <h2 className="nk-h2">
            One ecosystem uniting{" "}
            <span className="nk-accent">members, City Leads,</span> and{" "}
            <HandDrawnUnderline>verified experts.</HandDrawnUnderline>
          </h2>
        </div>

        <div className="nk-editorial-grid-3">
          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">01 · Members</span>
              <h3 className="nk-editorial-title">
                Newcomers, Expats &amp; Locals Abroad
              </h3>
              <p className="nk-editorial-body">
                Whether you arrived in Germany last week or have lived here for
                ten years, Newbee gives you a trusted circle in your city. Find
                cultural events, ask practical questions, and build lasting
                friendships.
              </p>
            </div>
            <div className="nk-editorial-foot">
              <a
                href="https://app.newbeeapp.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 700, color: "#111111" }}
              >
                Join free on iOS, Android, or Web ↗
              </a>
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">02 · City Leads</span>
              <h3 className="nk-editorial-title">
                City Leads &amp; Community Builders
              </h3>
              <p className="nk-editorial-body">
                Represent Newbee in your city, host local gatherings, curate
                regional tips, and grow your personal network with official
                platform tools, event ticketing, and co-marketing support from
                our core team.
              </p>
            </div>
            <div className="nk-editorial-foot">
              <Link
                href="/communities"
                style={{ fontWeight: 700, color: "#111111" }}
              >
                Explore the City Lead Program →
              </Link>
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">03 · Experts &amp; Brands</span>
              <h3 className="nk-editorial-title">
                Verified Experts &amp; Event Organizers
              </h3>
              <p className="nk-editorial-body">
                Showcase your professional expertise through verified Q&amp;A on{" "}
                <strong>expert.newbeeapp.com</strong>, or promote cultural
                events and diaspora-focused services directly to high-intent
                city audiences.
              </p>
            </div>
            <div className="nk-editorial-foot">
              <Link
                href="/businesses"
                style={{ fontWeight: 700, color: "#111111" }}
              >
                Partner with Newbee →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          03 / INSTITUTIONAL BACKING & RECOGNITION
          ==================================================================== */}
      <section className="nk-section" style={{ paddingTop: 24 }}>
        <div className="nk-section-header">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-num">03</span>
            <span>Awards &amp; Institutional Backing</span>
          </div>
          <h2 className="nk-h2">
            Recognized by leading{" "}
            <HandDrawnUnderline>German innovation</HandDrawnUnderline>{" "}
            institutions.
          </h2>
          <p className="nk-lead">
            Born in Frankfurt am Main and engineered by{" "}
            <strong>Beeyondapps Teknoloji Ltd. Şti.</strong>, Newbee is backed
            by premier academic, public, and technology ecosystems.
          </p>
        </div>

        <div className="nk-editorial-grid-3">
          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">€20,000 1st Prize</span>
              <h3 className="nk-editorial-title">
                Frankfurt School Entrepreneurship Centre
              </h3>
              <p className="nk-editorial-body">
                Awarded First Prize (€20,000) at the Frankfurt School of Finance
                &amp; Management Accelerator Pitching Competition for building
                scalable digital infrastructure for international communities in
                Germany.
              </p>
            </div>
            <div className="nk-editorial-foot">
              Frankfurt am Main · Accelerator Cohort Winner
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">State of Hesse</span>
              <h3 className="nk-editorial-title">Hessen Ideen Scholarship</h3>
              <p className="nk-editorial-body">
                Selected by the State of Hesse&apos;s university startup
                initiative supporting high-impact founders solving real social
                and economic integration challenges.
              </p>
            </div>
            <div className="nk-editorial-foot">
              Hessian Ministry of Higher Education, Research &amp; Arts
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">Cloud &amp; AI</span>
              <h3 className="nk-editorial-title">Google for Startups</h3>
              <p className="nk-editorial-body">
                Supported by Google for Startups with cloud infrastructure,
                modern mobile delivery pipelines, and privacy-first data
                architecture across Europe.
              </p>
            </div>
            <div className="nk-editorial-foot">
              GDPR &amp; KVKK Compliant Infrastructure
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          CLOSING DOWNLOAD CTA
          ==================================================================== */}
      <section className="nk-closing">
        <div className="nk-closing-inner">
          <div className="nk-eyebrow" style={{ justifyContent: "center" }}>
            <span className="nk-eyebrow-dot nk-pulse" />
            <span>Join the Hive Today</span>
          </div>

          <h2 className="nk-closing-h2">
            Ready to turn &ldquo;Help?!&rdquo; into{" "}
            <HandDrawnUnderline>&ldquo;Heeey!&rdquo;</HandDrawnUnderline>?
          </h2>

          <p className="nk-closing-sub">
            Download Newbee on iOS or Android, or sign in directly from your
            browser at <strong>app.newbeeapp.com</strong>.
          </p>

          <div className="nk-closing-actions">
            <a
              href="https://apps.apple.com/app/newbee/id6474511885"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-coral"
            >
              <span>Download on App Store</span>
              <ArrowUpRightBadge />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.beeyondapps.newbee"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-ink"
            >
              <span>Get it on Google Play</span>
              <ArrowUpRightDarkBadge />
            </a>
            <a
              href="https://app.newbeeapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-outline"
            >
              <span>Launch Web App ↗</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
