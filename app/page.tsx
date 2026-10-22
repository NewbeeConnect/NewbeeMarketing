"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  createScrollController,
  type ScrollController,
} from "@/components/scroll-controller";
import {
  ArrowUpRightBadge,
  ArrowUpRightDarkBadge,
  HandDrawnUnderline,
} from "@/components/Marks";
import { SITE } from "@/components/site-config";

const SLIDES = [
  { id: "start", index: "00", label: "Overview", nextLabel: "01 · Ask Questions" },
  { id: "ask", index: "01", label: "Ask Questions", nextLabel: "02 · Organize Events" },
  { id: "events", index: "02", label: "Organize Events", nextLabel: "03 · Meet New People" },
  { id: "meet", index: "03", label: "Meet New People", nextLabel: "Get Newbee" },
  { id: "get-started", index: "04", label: "Get Newbee", nextLabel: null },
] as const;

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const controllerRef = useRef<ScrollController | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const controller = createScrollController(
      document.documentElement,
      reduced,
      isCoarsePointer
    );
    controllerRef.current = controller;

    const sections = SLIDES.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );

    const slideObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = SLIDES.findIndex((s) => s.id === entry.target.id);
            if (idx !== -1) {
              setActiveIndex(idx);
            }
          }
        });
      },
      { threshold: 0.45 }
    );

    sections.forEach((sec) => slideObserver.observe(sec));

    const revealEls = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "true");
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => revealObserver.observe(el));

    return () => {
      controller.dispose();
      controllerRef.current = null;
      slideObserver.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  const currentSlide = SLIDES[activeIndex] ?? SLIDES[0];
  const nextSlide = SLIDES[activeIndex + 1] ?? null;

  const handleJump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (controllerRef.current) {
      controllerRef.current.to(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Left Slide Progress Dots (neoklinik.io style) */}
      <aside className="nk-slide-dots" aria-label="Slide navigation">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={(e) => handleJump(e, slide.id)}
            className={`nk-slide-dot ${activeIndex === idx ? "active" : ""}`}
            aria-label={`Go to slide ${slide.index}: ${slide.label}`}
            title={`${slide.index} · ${slide.label}`}
          />
        ))}
      </aside>

      {/* Bottom-Right Next Slide Pill (neoklinik.io style) */}
      {nextSlide && (
        <a
          href={`#${nextSlide.id}`}
          onClick={(e) => handleJump(e, nextSlide.id)}
          className="nk-next-pill"
          aria-label={`Jump to next slide: ${currentSlide.nextLabel}`}
        >
          <span className="nk-next-kicker">Next</span>
          <span>{currentSlide.nextLabel}</span>
          <span className="nk-next-arrow" aria-hidden="true">
            ↓
          </span>
        </a>
      )}

      {/* =====================================================================
          SLIDE 00 — HERO / OVERVIEW
         ===================================================================== */}
      <section id="start" data-snap="" className="nk-slide">
        <div className="nk-slide-inner">
          {/* Left Copy */}
          <div data-reveal="">
            <div className="nk-eyebrow">
              <span className="nk-eyebrow-dot" />
              <span>LIVING ABROAD, SIMPLIFIED · iOS · ANDROID · WEB</span>
            </div>

            <h1 className="nk-h1">
              One-stop app to{" "}
              <HandDrawnUnderline>navigate</HandDrawnUnderline> all challenges
              of moving and living abroad.
            </h1>

            <p className="nk-lead">
              Ask questions, organize events, and meet new people in your city.
            </p>

            {/* Primary Dual CTAs: Download Newbee + Continue on Web */}
            <div className="nk-cta-row">
              <Link href="/download" className="nk-btn-yellow">
                <span>Download Newbee</span>
                <ArrowUpRightDarkBadge />
              </Link>

              <a
                href={SITE.webAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nk-btn-primary"
              >
                <span>Continue on Web</span>
                <ArrowUpRightBadge />
              </a>
            </div>

            {/* Direct Store & Slide Links */}
            <div className="nk-store-subrow">
              <span>Available on</span>
              <a
                href={SITE.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                App Store ↗
              </a>
              <span>·</span>
              <a
                href={SITE.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Play ↗
              </a>
              <span>·</span>
              <a
                href={SITE.webAppUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                app.newbeeapp.com ↗
              </a>
            </div>
          </div>

          {/* Right Stage: Real App Mockup + Out-of-Phone Pop-Out Elements */}
          <div className="nk-stage" data-reveal="">
            <div className="nk-stage-halo" aria-hidden="true" />

            {/* Center iPhone Mockup */}
            <div className="nk-phone-wrap">
              <Image
                src="/screens/home.png"
                alt="Newbee mobile app home screen"
                width={500}
                height={1022}
                priority
                className="nk-phone-img"
              />
            </div>

            {/* Pop-out 1: Real Event Photo Card spilling out top-left */}
            <div className="nk-pop nk-pop-photo nk-pos-tl">
              <Image
                src="/events/welcome-breakfast.jpg"
                alt="Newbee community breakfast meetup"
                width={380}
                height={280}
              />
              <div className="nk-pop-photo-cap">
                <span>Sunday Brunch 🥐</span>
                <span className="nk-pop-photo-tag">+24</span>
              </div>
            </div>

            {/* Pop-out 2: Editorial Illustration Card spilling out top-right */}
            <div className="nk-pop nk-pop-illus nk-pos-tr">
              <Image
                src="/illustrations/ask-illustration.jpg"
                alt="Ask anything abroad illustration"
                width={320}
                height={320}
              />
              <div className="nk-pop-illus-label">Ask &amp; Settle In</div>
            </div>

            {/* Pop-out 3: Out-of-phone Q&A Answer Bubble bottom-left */}
            <div className="nk-pop nk-pop-bubble nk-pos-bl">
              <div className="nk-pop-bubble-kicker">
                <span>💬 City Q&amp;A</span>
              </div>
              <div className="nk-pop-bubble-text">
                &ldquo;How do I register my address and open a local bank
                account?&rdquo;
              </div>
              <div className="nk-pop-bubble-sub">✓ Answered in 4 min</div>
            </div>

            {/* Pop-out 4: Live RSVP Bubble bottom-right */}
            <div className="nk-pop nk-pop-bubble nk-pop-bubble-yellow nk-pos-br">
              <div className="nk-pop-bubble-kicker">
                <span>🐝 Tonight · 19:30</span>
              </div>
              <div className="nk-pop-bubble-text">
                Newcomers Mixer &amp; Drinks
              </div>
              <div className="nk-pop-bubble-sub">28 people going →</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SLIDE 01 — ASK QUESTIONS
         ===================================================================== */}
      <section id="ask" data-snap="" className="nk-slide nk-slide-alt">
        <div className="nk-slide-inner">
          {/* Left Copy */}
          <div data-reveal="">
            <div className="nk-eyebrow">
              <span className="nk-eyebrow-num">01 / 03</span>
              <span>ASK QUESTIONS</span>
            </div>

            <h2 className="nk-h2">
              Ask <HandDrawnUnderline>anything.</HandDrawnUnderline>
              <br />
              Get real answers.
            </h2>

            <p className="nk-lead">
              Housing, visas, taxes, healthcare, or the best neighborhood
              bakery—get fast, trusted answers from people and verified
              professionals in your city.
            </p>

            <div className="nk-pill-row">
              <span className="nk-topic-pill">🛂 Visas &amp; Bureaucracy</span>
              <span className="nk-topic-pill">🏠 Housing &amp; Rentals</span>
              <span className="nk-topic-pill">⚖️ Verified Experts</span>
              <span className="nk-topic-pill">📍 Local Tips</span>
            </div>

            <div className="nk-cta-row">
              <a
                href={SITE.webAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nk-btn-primary"
              >
                <span>Ask on Web App</span>
                <ArrowUpRightBadge />
              </a>
              <Link href="/download" className="nk-btn-secondary">
                <span>Get the Mobile App ↓</span>
              </Link>
            </div>
          </div>

          {/* Right Stage: Feed Phone + Secondary Ask Phone + Pop-Out Elements */}
          <div className="nk-stage" data-reveal="">
            <div className="nk-stage-halo" aria-hidden="true" />

            {/* Center Feed Phone */}
            <div className="nk-phone-wrap">
              <Image
                src="/screens/feed.png"
                alt="Newbee community Q&A feed screen"
                width={500}
                height={1022}
                className="nk-phone-img"
              />
            </div>

            {/* Secondary Ask Screen tilted behind */}
            <Image
              src="/screens/feed-ask.png"
              alt="Newbee ask a question screen"
              width={420}
              height={858}
              className="nk-phone-img nk-phone-secondary"
            />

            {/* Pop-out 1: Hand-drawn Ask Illustration top-left */}
            <div className="nk-pop nk-pop-illus nk-pos-tl">
              <Image
                src="/illustrations/ask-illustration.jpg"
                alt="Illustration of asking questions in a new country"
                width={340}
                height={340}
              />
              <div className="nk-pop-illus-label">Local Knowledge</div>
            </div>

            {/* Pop-out 2: Verified Answer Bubble bottom-left */}
            <div className="nk-pop nk-pop-bubble nk-pos-bl">
              <div className="nk-pop-bubble-kicker">
                <span>✓ Verified Expert Reply</span>
              </div>
              <div className="nk-pop-bubble-text">
                &ldquo;Bring your signed landlord confirmation to the morning
                slot—it takes 10 minutes.&rdquo;
              </div>
              <div className="nk-pop-bubble-sub">+18 helpful votes</div>
            </div>

            {/* Pop-out 3: Fast reply pill top-right */}
            <div className="nk-pop nk-pop-bubble nk-pop-bubble-yellow nk-pos-tr">
              <div className="nk-pop-bubble-kicker">
                <span>⚡ City Feed</span>
              </div>
              <div className="nk-pop-bubble-text">
                English- speaking family doctor in the city center?
              </div>
              <div className="nk-pop-bubble-sub">12 recommendations</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SLIDE 02 — ORGANIZE EVENTS
         ===================================================================== */}
      <section id="events" data-snap="" className="nk-slide">
        <div className="nk-slide-inner">
          {/* Left Copy */}
          <div data-reveal="">
            <div className="nk-eyebrow">
              <span className="nk-eyebrow-num">02 / 03</span>
              <span>ORGANIZE EVENTS</span>
            </div>

            <h2 className="nk-h2">
              Host or join <HandDrawnUnderline>events</HandDrawnUnderline> in
              your city.
            </h2>

            <p className="nk-lead">
              From Sunday brunches and sunny park picnics to wine tastings and
              founder mixers—create your own gathering in seconds or RSVP with
              one tap.
            </p>

            <div className="nk-pill-row">
              <span className="nk-topic-pill">🍷 Wine &amp; Aperitivo</span>
              <span className="nk-topic-pill">🥐 Sunday Brunch</span>
              <span className="nk-topic-pill">🧺 Park Picnics</span>
              <span className="nk-topic-pill">🎟️ 1-Tap RSVP</span>
            </div>

            <div className="nk-cta-row">
              <Link href="/download" className="nk-btn-yellow">
                <span>Explore Events in App</span>
                <ArrowUpRightDarkBadge />
              </Link>
              <a
                href={SITE.webAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nk-btn-secondary"
              >
                <span>Open Web App ↗</span>
              </a>
            </div>
          </div>

          {/* Right Stage: Events Phone + Out-of-Phone Event Photos & Illustration */}
          <div className="nk-stage" data-reveal="">
            <div className="nk-stage-halo" aria-hidden="true" />

            {/* Center Events Phone */}
            <div className="nk-phone-wrap">
              <Image
                src="/screens/events.png"
                alt="Newbee events discovery and RSVP screen"
                width={500}
                height={1022}
                className="nk-phone-img"
              />
            </div>

            {/* Pop-out 1: Real Wine Tasting Group Photo top-left */}
            <div className="nk-pop nk-pop-photo nk-pos-tl">
              <Image
                src="/events/wine-tasting-group.jpg"
                alt="Newbee evening wine tasting event"
                width={380}
                height={280}
              />
              <div className="nk-pop-photo-cap">
                <span>Wine Tasting 🍷</span>
                <span className="nk-pop-photo-tag">FRI</span>
              </div>
            </div>

            {/* Pop-out 2: Editorial Events Illustration top-right */}
            <div className="nk-pop nk-pop-illus nk-pos-tr">
              <Image
                src="/illustrations/events-illustration.jpg"
                alt="Illustration of local events and gatherings"
                width={340}
                height={340}
              />
              <div className="nk-pop-illus-label">Host &amp; Gather</div>
            </div>

            {/* Pop-out 3: Real Summer Picnic Photo bottom-right */}
            <div className="nk-pop nk-pop-photo nk-pos-br">
              <Image
                src="/events/summer-picnic.jpg"
                alt="Newbee outdoor park picnic"
                width={380}
                height={280}
              />
              <div className="nk-pop-photo-cap">
                <span>Park Picnic 🧺</span>
                <span className="nk-pop-photo-tag">SAT</span>
              </div>
            </div>

            {/* Pop-out 4: Host pill bottom-left */}
            <div className="nk-pop nk-pop-bubble nk-pos-bl">
              <div className="nk-pop-bubble-kicker">
                <span>✨ Host a Meetup</span>
              </div>
              <div className="nk-pop-bubble-text">
                Create a table or city event in 30 seconds
              </div>
              <div className="nk-pop-bubble-sub">Instant guest list &amp; chat</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SLIDE 03 — MEET NEW PEOPLE
         ===================================================================== */}
      <section id="meet" data-snap="" className="nk-slide nk-slide-alt">
        <div className="nk-slide-inner">
          {/* Left Copy */}
          <div data-reveal="">
            <div className="nk-eyebrow">
              <span className="nk-eyebrow-num">03 / 03</span>
              <span>MEET NEW PEOPLE</span>
            </div>

            <h2 className="nk-h2">
              Turn a new city into <HandDrawnUnderline>home.</HandDrawnUnderline>
            </h2>

            <p className="nk-lead">
              Discover people nearby who share your interests, profession, or
              neighborhood. Join interest circles and build real friendships
              from day one.
            </p>

            <div className="nk-pill-row">
              <span className="nk-topic-pill">👋 People Nearby</span>
              <span className="nk-topic-pill">☕ Coffee &amp; Co-working</span>
              <span className="nk-topic-pill">🏃 Running &amp; Outdoors</span>
              <span className="nk-topic-pill">🎨 Interest Circles</span>
            </div>

            <div className="nk-cta-row">
              <Link href="/download" className="nk-btn-primary">
                <span>Meet People on Newbee</span>
                <ArrowUpRightBadge />
              </Link>
              <a
                href={SITE.webAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nk-btn-secondary"
              >
                <span>Continue on Web ↗</span>
              </a>
            </div>
          </div>

          {/* Right Stage: People + Communities Phones + Out-of-Phone Photos & Illustration */}
          <div className="nk-stage" data-reveal="">
            <div className="nk-stage-halo" aria-hidden="true" />

            {/* Primary People Nearby Phone */}
            <div className="nk-phone-wrap">
              <Image
                src="/screens/people.png"
                alt="Newbee discover people nearby screen"
                width={500}
                height={1022}
                className="nk-phone-img"
              />
            </div>

            {/* Secondary Communities Phone */}
            <Image
              src="/screens/communities.png"
              alt="Newbee communities and interest groups screen"
              width={420}
              height={858}
              className="nk-phone-img nk-phone-secondary"
            />

            {/* Pop-out 1: Editorial Meet Illustration top-right */}
            <div className="nk-pop nk-pop-illus nk-pos-tr">
              <Image
                src="/illustrations/meet-illustration.jpg"
                alt="Illustration of friends meeting for coffee"
                width={340}
                height={340}
              />
              <div className="nk-pop-illus-label">New Friends</div>
            </div>

            {/* Pop-out 2: Sunday Brunch Photo top-left */}
            <div className="nk-pop nk-pop-photo nk-pos-tl">
              <Image
                src="/events/sunday-brunch.jpg"
                alt="Friends meeting at a Newbee Sunday brunch"
                width={380}
                height={280}
              />
              <div className="nk-pop-photo-cap">
                <span>Coffee Club ☕</span>
                <span className="nk-pop-photo-tag">NEW</span>
              </div>
            </div>

            {/* Pop-out 3: Shared Interests Pill bottom-left */}
            <div className="nk-pop nk-pop-bubble nk-pos-bl">
              <div className="nk-pop-bubble-kicker">
                <span>🤝 3 Shared Interests</span>
              </div>
              <div className="nk-pop-bubble-text">
                Architecture · Running · Specialty Coffee
              </div>
              <div className="nk-pop-bubble-sub">Say hello 👋</div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SLIDE 04 — GET STARTED (DOWNLOAD APP OR CONTINUE ON WEB)
         ===================================================================== */}
      <section
        id="get-started"
        data-snap=""
        className="nk-slide nk-slide-closing"
      >
        <div className="nk-closing-wrap" data-reveal="">
          <div className="nk-eyebrow" style={{ justifyContent: "center" }}>
            <span className="nk-eyebrow-dot" />
            <span>FREE ON iOS, ANDROID &amp; WEB</span>
          </div>

          <h2 className="nk-h1" style={{ maxWidth: 760, margin: "0 auto" }}>
            You&apos;re <HandDrawnUnderline>home,</HandDrawnUnderline> wherever
            you are.
          </h2>

          <p className="nk-lead" style={{ margin: "18px auto 0" }}>
            One-stop app to navigate all challenges of moving and living abroad.
          </p>

          <div className="nk-closing-cards">
            {/* Card 1: Download Mobile App */}
            <div className="nk-closing-card nk-closing-card-yellow">
              <div>
                <div className="nk-closing-card-kicker">
                  01 · iOS &amp; ANDROID APP
                </div>
                <h3 className="nk-closing-card-title">Download Newbee</h3>
                <p className="nk-closing-card-desc">
                  Get instant notifications for replies to your questions,
                  upcoming city events, and new people nearby.
                </p>
              </div>

              <div className="nk-cta-row" style={{ marginTop: 8 }}>
                <a
                  href={SITE.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nk-btn-primary"
                >
                  <span>App Store (iOS)</span>
                  <ArrowUpRightBadge />
                </a>
                <a
                  href={SITE.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nk-btn-secondary"
                >
                  <span>Google Play (Android) ↗</span>
                </a>
              </div>
            </div>

            {/* Card 2: Continue on Web */}
            <div className="nk-closing-card">
              <div>
                <div className="nk-closing-card-kicker">
                  02 · WEB VERSION · APP.NEWBEEAPP.COM
                </div>
                <h3 className="nk-closing-card-title">
                  Continue on Newbee Web
                </h3>
                <p className="nk-closing-card-desc">
                  Prefer using your browser on laptop or mobile? Jump straight
                  into the live community feed, events, and Q&amp;A at{" "}
                  <strong>app.newbeeapp.com</strong>.
                </p>
              </div>

              <div className="nk-cta-row" style={{ marginTop: 8 }}>
                <a
                  href={SITE.webAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nk-btn-primary"
                >
                  <span>Open app.newbeeapp.com</span>
                  <ArrowUpRightBadge />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
