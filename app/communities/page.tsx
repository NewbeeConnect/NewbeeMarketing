import type { Metadata } from "next";
import Link from "next/link";
import {
  HandDrawnUnderline,
  ArrowUpRightBadge,
  ArrowUpRightDarkBadge,
} from "@/components/Marks";

export const metadata: Metadata = {
  title: "Communities & City Lead Program",
  description:
    "Explore Newbee city hubs across Frankfurt, Berlin, Munich, Hamburg, Cologne, Düsseldorf, and Stuttgart — or apply to lead your local community as an official Newbee City Lead.",
};

const CITY_HUBS = [
  {
    region: "Hesse · Rhine-Main",
    city: "Frankfurt am Main",
    highlights:
      "Home base of Newbee. Active newcomers circle, finance & tech mixers, family playdates, and regular cultural gatherings.",
    status: "Flagship Hub",
  },
  {
    region: "Berlin · Brandenburg",
    city: "Berlin",
    highlights:
      "Founders, creatives, tech professionals, and cultural stage events with weekly Q&A threads on housing and freelance life.",
    status: "Active Hub",
  },
  {
    region: "Bavaria",
    city: "Munich",
    highlights:
      "Engineering & academic circles, family relocation guides, Alpine weekend meetups, and verified legal/tax Q&A.",
    status: "Active Hub",
  },
  {
    region: "North Rhine-Westphalia",
    city: "Cologne & Düsseldorf",
    highlights:
      "Vibrant cultural calendar, concerts, stand-up shows, entrepreneurship networking, and cross-city community events.",
    status: "Active Hub",
  },
  {
    region: "Northern Germany",
    city: "Hamburg",
    highlights:
      "Media, logistics, and expat social circles bringing newcomers together for harbor meetups and cultural nights.",
    status: "Active Hub",
  },
  {
    region: "Baden-Württemberg",
    city: "Stuttgart & Karlsruhe",
    highlights:
      "Automotive, engineering, and university communities sharing housing tips, family resources, and regional events.",
    status: "Active Hub",
  },
];

export default function CommunitiesPage() {
  return (
    <>
      <section className="nk-hero">
        <div className="nk-hero-top">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-dot nk-pulse" />
            <span>City Hubs · Topic Circles · City Lead Program</span>
          </div>

          <h1 className="nk-h1">
            Local communities led by{" "}
            <HandDrawnUnderline>real people</HandDrawnUnderline> in{" "}
            <span className="nk-accent">every major city.</span>
          </h1>

          <p className="nk-lead">
            Newbee organizes diaspora and expat life around structured city hubs
            and interest circles — so you can connect with neighbors in your
            metropolitan area, attend real-world meetups, and get reliable local
            recommendations.
          </p>

          <div className="nk-actions">
            <a
              href="https://app.newbeeapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-coral"
            >
              <span>Join Your City Hub</span>
              <ArrowUpRightBadge />
            </a>
            <Link href="/contact?topic=city-lead" className="nk-btn-ink">
              <span>Apply as a City Lead</span>
              <ArrowUpRightDarkBadge />
            </Link>
          </div>
        </div>

        <div className="nk-blueprint-strip">
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">01 / City Hubs</span>
            <span className="nk-blueprint-val">30+ Regions</span>
            <span className="nk-blueprint-sub">
              Dedicated local spaces across Germany&apos;s key metropolitan
              areas.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">02 / Interest Groups</span>
            <span className="nk-blueprint-val">Topic Circles</span>
            <span className="nk-blueprint-sub">
              Parents &amp; Family, Founders &amp; Tech, Culture &amp; Arts,
              Relocation &amp; Bureaucracy.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">03 / Leadership</span>
            <span className="nk-blueprint-val">City Leads</span>
            <span className="nk-blueprint-sub">
              Local ambassadors who curate guides, welcome newcomers, and host
              city mixers.
            </span>
          </div>
          <div className="nk-blueprint-cell">
            <span className="nk-blueprint-meta">04 / Events</span>
            <span className="nk-blueprint-val">In-App QR</span>
            <span className="nk-blueprint-sub">
              Built-in event pages, RSVP management, and instant QR check-in for
              community hosts.
            </span>
          </div>
        </div>
      </section>

      {/* ACTIVE CITY HUBS */}
      <section className="nk-section">
        <div className="nk-section-header">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-num">01</span>
            <span>Metropolitan Network</span>
          </div>
          <h2 className="nk-h2">
            Find your circle across{" "}
            <HandDrawnUnderline>Germany.</HandDrawnUnderline>
          </h2>
          <p className="nk-lead">
            Select your city inside the Newbee app to customize your feed,
            upcoming events calendar, and local Q&amp;A threads.
          </p>
        </div>

        <div className="nk-editorial-grid-3">
          {CITY_HUBS.map((item) => (
            <div key={item.city} className="nk-editorial-col">
              <div>
                <span className="nk-editorial-tag">{item.status}</span>
                <h3 className="nk-editorial-title">{item.city}</h3>
                <p className="nk-editorial-body">{item.highlights}</p>
              </div>
              <div className="nk-editorial-foot">{item.region}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CITY LEAD PROGRAM */}
      <section className="nk-section" style={{ paddingTop: 16 }}>
        <div className="nk-section-header">
          <div className="nk-eyebrow">
            <span className="nk-eyebrow-num">02</span>
            <span>Newbee City Lead Program</span>
          </div>
          <h2 className="nk-h2">
            Lead your city&apos;s community and{" "}
            <span className="nk-accent">grow your local network.</span>
          </h2>
          <p className="nk-lead">
            <strong>Newbee City Leads</strong> are the faces of our community in
            each city — connectors, organizers, and local insiders who bring
            people together both online and in person.
          </p>
        </div>

        <div className="nk-editorial-grid-3">
          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">01 · What You Do</span>
              <h3 className="nk-editorial-title">
                Curate, Welcome &amp; Host
              </h3>
              <p className="nk-editorial-body">
                Welcome new arrivals in your city hub, spark meaningful local
                discussions, share vetted city tips, and host periodic social
                mixers or topical meetups with full support from the Newbee team.
              </p>
            </div>
            <div className="nk-editorial-foot">
              Flexible schedule · Tailored to your city
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">02 · What You Gain</span>
              <h3 className="nk-editorial-title">
                Visibility, Tools &amp; Exclusive Access
              </h3>
              <p className="nk-editorial-body">
                Receive an official <strong>City Lead badge</strong> on your
                profile, dedicated event management &amp; QR ticketing tools,
                co-branded social media promotion, priority access to cultural
                events, and direct mentorship with Newbee&apos;s founding team.
              </p>
            </div>
            <div className="nk-editorial-foot">
              Official badge · Event sponsorship &amp; ticketing tools
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">03 · Who Can Apply</span>
              <h3 className="nk-editorial-title">
                Proactive Connectors Across Europe
              </h3>
              <p className="nk-editorial-body">
                Whether you are a young professional, founder, creative, or
                long-time resident who loves bringing people together and knows
                your city well, we would love to welcome you to the City Lead
                cohort.
              </p>
            </div>
            <div className="nk-editorial-foot">
              <Link
                href="/contact?topic=city-lead"
                style={{ fontWeight: 700, color: "#111111" }}
              >
                Submit your City Lead application →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="nk-closing">
        <div className="nk-closing-inner">
          <div className="nk-eyebrow" style={{ justifyContent: "center" }}>
            <span className="nk-eyebrow-dot nk-pulse" />
            <span>Become a City Lead</span>
          </div>
          <h2 className="nk-closing-h2">
            Ready to represent{" "}
            <HandDrawnUnderline>your city</HandDrawnUnderline> on Newbee?
          </h2>
          <p className="nk-closing-sub">
            Reach out to our community team to apply for the City Lead program
            or propose a new city hub.
          </p>
          <div className="nk-closing-actions">
            <Link href="/contact?topic=city-lead" className="nk-btn-coral">
              <span>Apply as a City Lead</span>
              <ArrowUpRightBadge />
            </Link>
            <a
              href="https://app.newbeeapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn-ink"
            >
              <span>Explore Hubs in Web App</span>
              <ArrowUpRightDarkBadge />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
