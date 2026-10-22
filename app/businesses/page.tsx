import type { Metadata } from "next";
import Link from "next/link";
import {
  HandDrawnUnderline,
  ArrowUpRightBadge,
  ArrowUpRightDarkBadge,
} from "@/components/Marks";

export const metadata: Metadata = {
  title: "Verified Experts, Event Organizers & Brand Partners",
  description:
    "Connect with thousands of newcomers and expats in Germany as a Verified Newbee Expert on expert.newbeeapp.com, or partner with Newbee to promote cultural events and local businesses.",
};

const EXPERT_CATEGORIES = [
  {
    tag: "Legal & Residence",
    title: "Immigration, Visa & Citizenship Lawyers",
    body: "Answer high-intent community questions on EU Blue Cards, skilled worker permits, family reunification, business formation, and naturalization in Germany.",
    foot: "Verified Legal Q&A · Direct Consultation Requests",
  },
  {
    tag: "Tax & Finance",
    title: "Tax Advisors, Accountants & Financial Planners",
    body: "Help newcomers and freelancers navigate German tax classes, annual declarations, GmbH/UG accounting, and cross-border financial compliance.",
    foot: "Verified Finance Q&A · Expert Profile Badge",
  },
  {
    tag: "Housing & Insurance",
    title: "Mortgage Brokers, Real Estate & Insurance Specialists",
    body: "Guide families and professionals through property financing (Baufinanzierung), rental rights, and statutory vs. private health insurance.",
    foot: "Verified Advisory Q&A · Regional Lead Routing",
  },
  {
    tag: "Health & Family",
    title: "Psychologists, Educators & Relocation Coaches",
    body: "Support expat individuals and families adapting to life abroad with native-language counseling, school/Kita guidance, and integration coaching.",
    foot: "Verified Well-Being Q&A · Workshop Hosting",
  },
  {
    tag: "Cultural Events",
    title: "Concert Promoters, Theatres & Event Organizers",
    body: "List concerts, stand-up tours, exhibitions, and festivals on Newbee with city-targeted visibility and built-in QR ticketing.",
    foot: "In-App Event Listings · Instant QR Check-In",
  },
  {
    tag: "Brand Partnerships",
    title: "Diaspora Brands & Local Businesses",
    body: "Run sponsored community polls, city-specific campaigns, and co-branded newcomer guides that deliver measurable engagement.",
    foot: "Targeted City Campaigns · Sponsored Content",
  },
];

export default function BusinessesPage() {
  return (
    <>
      <section className="nk-hero">
        <div className="nk-hero-top">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-dot nk-pulse" />
            <span>Verified Experts · Event Organizers · Brand Partners</span>
          </div>

          <h1 className="nk-h1">
            Reach newcomers and expats with{" "}
            <HandDrawnUnderline>verified trust</HandDrawnUnderline> and{" "}
            <span className="nk-accent">local relevance.</span>
          </h1>

          <p className="nk-lead">
            Newcomers in Germany actively look for professionals who speak their
            language and understand both local regulations and diaspora needs.{" "}
            <strong>Newbee</strong> gives verified experts, event organizers,
            and brands a structured, high-trust channel to connect with
            communities across every major German city.
          </p>

          <div className="nk-actions">
            <a
              href="https://expert.newbeeapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-coral"
            >
              <span>Open Expert Portal (expert.newbeeapp.com)</span>
              <ArrowUpRightBadge />
            </a>
            <Link href="/contact?topic=expert" className="nk-btn-ink">
              <span>Apply as a Verified Partner</span>
              <ArrowUpRightDarkBadge />
            </Link>
          </div>
        </div>

        <div className="nk-blueprint-strip">
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">01 / Expert Portal</span>
            <span className="nk-blueprint-val">Dedicated Workspace</span>
            <span className="nk-blueprint-sub">
              Manage your professional profile and answer category-routed
              questions at expert.newbeeapp.com.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">02 / High Intent</span>
            <span className="nk-blueprint-val">Topic Q&amp;A</span>
            <span className="nk-blueprint-sub">
              Your expert answers remain discoverable in city and category feeds
              long after publication.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">03 / Event Ticketing</span>
            <span className="nk-blueprint-val">QR Check-In</span>
            <span className="nk-blueprint-sub">
              Seamless RSVP and QR ticket issuance for cultural shows,
              workshops, and networking nights.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">04 / Verification</span>
            <span className="nk-blueprint-val">Credential Vetted</span>
            <span className="nk-blueprint-sub">
              Every expert is reviewed by the Newbee team to maintain community
              safety and trust.
            </span>
          </div>
        </div>
      </section>

      <section className="nk-section">
        <div className="nk-section-header">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-num">01</span>
            <span>Partner Categories</span>
          </div>
          <h2 className="nk-h2">
            Built for{" "}
            <HandDrawnUnderline>licensed professionals</HandDrawnUnderline> and{" "}
            cultural organizers.
          </h2>
          <p className="nk-lead">
            Whether you advise clients on German law and taxation or bring
            artists on tour across Europe, Newbee connects you with the right
            audience in the right city.
          </p>
        </div>

        <div className="nk-editorial-grid-3">
          {EXPERT_CATEGORIES.map((cat) => (
            <div key={cat.title} className="nk-editorial-col">
              <div>
                <span className="nk-editorial-tag">{cat.tag}</span>
                <h3 className="nk-editorial-title">{cat.title}</h3>
                <p className="nk-editorial-body">{cat.body}</p>
              </div>
              <div className="nk-editorial-foot">{cat.foot}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="nk-closing">
        <div className="nk-closing-inner">
          <div className="nk-eyebrow" style={{ justifyContent: "center" }}>
            <span className="nk-eyebrow-dot nk-pulse" />
            <span>Partner With Newbee</span>
          </div>
          <h2 className="nk-closing-h2">
            Become a{" "}
            <HandDrawnUnderline>Verified Expert</HandDrawnUnderline> or Event
            Partner.
          </h2>
          <p className="nk-closing-sub">
            Already onboarded? Sign in at{" "}
            <strong>expert.newbeeapp.com</strong>. Looking to join our verified
            network or sponsor a community campaign? Send us a message.
          </p>
          <div className="nk-closing-actions">
            <Link href="/contact?topic=expert" className="nk-btn-coral">
              <span>Request Partner Onboarding</span>
              <ArrowUpRightBadge />
            </Link>
            <a
              href="https://expert.newbeeapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-ink"
            >
              <span>Sign In to Expert Portal</span>
              <ArrowUpRightDarkBadge />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
