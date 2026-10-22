"use client";

import { useState } from "react";
import Link from "next/link";
import { HandDrawnUnderline } from "@/components/Marks";

type InquiryType =
  | "general"
  | "city-lead"
  | "expert"
  | "event"
  | "deletion";

export default function ContactPage() {
  const [topic, setTopic] = useState<InquiryType>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail =
      topic === "deletion"
        ? "privacy@beeyondapps.com"
        : "info@beeyondapps.com";

    const subjectLabels: Record<InquiryType, string> = {
      general: "Newbee Platform Support / General Inquiry",
      "city-lead": "Newbee City Lead Application",
      expert: "Newbee Verified Expert Onboarding",
      event: "Newbee Cultural Event / Brand Partnership",
      deletion: "Newbee GDPR / KVKK Account & Data Deletion Request",
    };

    const subject = encodeURIComponent(
      `[${subjectLabels[topic]}] ${name}${city ? ` (${city})` : ""}`
    );
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCity / Region: ${
        city || "N/A"
      }\nTopic: ${subjectLabels[topic]}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <section className="nk-section" style={{ paddingTop: 64 }}>
      <div className="nk-section-header">
        <div className="nk-eyebrow">
          <span className="nk-eyebrow-dot nk-pulse" />
          <span>Support · City Leads · Experts · Privacy Center</span>
        </div>
        <h1 className="nk-h1">
          Let&apos;s <HandDrawnUnderline>connect</HandDrawnUnderline> with the{" "}
          <span className="nk-accent">Newbee team.</span>
        </h1>
        <p className="nk-lead">
          Reach out for member support, City Lead applications, Verified Expert
          onboarding, cultural event collaborations, or GDPR/KVKK data requests.
        </p>
      </div>

      <div className="nk-contact-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">01 · Direct Channels</span>
              <h2 className="nk-editorial-title">Official Contact Details</h2>
              <p className="nk-editorial-body">
                <strong>General, Partnerships &amp; City Leads:</strong>
                <br />
                <a
                  href="mailto:info@beeyondapps.com"
                  style={{
                    textDecoration: "underline",
                    textDecorationColor: "#ffb72a",
                    fontWeight: 600,
                  }}
                >
                  info@beeyondapps.com
                </a>
              </p>
              <p className="nk-editorial-body">
                <strong>Privacy, GDPR &amp; KVKK Data Protection:</strong>
                <br />
                <a
                  href="mailto:privacy@beeyondapps.com"
                  style={{
                    textDecoration: "underline",
                    textDecorationColor: "#ffb72a",
                    fontWeight: 600,
                  }}
                >
                  privacy@beeyondapps.com
                </a>
              </p>
            </div>
            <div className="nk-editorial-foot">
              Response time: typically within 1–2 business days
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">02 · Account Deletion</span>
              <h2 className="nk-editorial-title">
                In-App &amp; Web Account Deletion
              </h2>
              <p className="nk-editorial-body">
                You can permanently delete your Newbee account and associated
                profile data at any time directly inside the Newbee iOS,
                Android, or Web app under{" "}
                <strong>Profile → Settings → Delete Account</strong>. You may
                also submit a formal GDPR / KVKK erasure request using this form
                or by emailing{" "}
                <a
                  href="mailto:privacy@beeyondapps.com"
                  style={{ textDecoration: "underline", fontWeight: 600 }}
                >
                  privacy@beeyondapps.com
                </a>
                .
              </p>
            </div>
            <div className="nk-editorial-foot">
              <Link href="/privacy" style={{ fontWeight: 700, color: "#111111" }}>
                Read Full Privacy Policy &amp; KVKK Notice →
              </Link>
            </div>
          </div>

          <div className="nk-editorial-col">
            <div>
              <span className="nk-editorial-tag">03 · Operating Entity</span>
              <h2 className="nk-editorial-title">
                BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ
              </h2>
              <p className="nk-editorial-body">
                Abdurrahmangazi Mah. Ebubekir Cad. No: 73 İç Kapı No: 1
                <br />
                Sancaktepe / İstanbul, Türkiye
                <br />
                Community &amp; Product Hub: Frankfurt am Main, Germany
              </p>
            </div>
            <div className="nk-editorial-foot">
              Instagram:{" "}
              <a
                href="https://www.instagram.com/newbeeappsocials/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: 700, color: "#111111" }}
              >
                @newbeeappsocials ↗
              </a>
            </div>
          </div>
        </div>

        <div className="nk-form-card">
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Send a Message
          </h2>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: "#57534a" }}>
            Select a topic below so we can route your inquiry to the right team.
          </p>

          <form className="nk-form" onSubmit={handleSubmit}>
            <label className="nk-label">
              <span>INQUIRY TOPIC</span>
              <select
                className="nk-select"
                value={topic}
                onChange={(e) => setTopic(e.target.value as InquiryType)}
              >
                <option value="general">
                  Platform Support / General Question
                </option>
                <option value="city-lead">
                  Apply for the Newbee City Lead Program
                </option>
                <option value="expert">
                  Apply as a Verified Expert (expert.newbeeapp.com)
                </option>
                <option value="event">
                  Cultural Event Listing / Brand Partnership
                </option>
                <option value="deletion">
                  GDPR / KVKK Account &amp; Data Deletion Request
                </option>
              </select>
            </label>

            <div className="nk-form-row-2">
              <label className="nk-label">
                <span>YOUR NAME *</span>
                <input
                  type="text"
                  required
                  className="nk-input"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="nk-label">
                <span>EMAIL ADDRESS *</span>
                <input
                  type="email"
                  required
                  className="nk-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>

            <label className="nk-label">
              <span>CITY / REGION (OPTIONAL)</span>
              <input
                type="text"
                className="nk-input"
                placeholder="e.g. Frankfurt am Main, Berlin, Munich"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>

            <label className="nk-label">
              <span>MESSAGE / DETAILS *</span>
              <textarea
                required
                className="nk-textarea"
                placeholder={
                  topic === "city-lead"
                    ? "Tell us about your city, your background, and the kinds of local gatherings or topics you'd love to lead..."
                    : topic === "expert"
                    ? "Share your professional field (e.g. Immigration Law, Tax, Real Estate), spoken languages, and website/LinkedIn..."
                    : topic === "deletion"
                    ? "Please provide the email address or phone number associated with your Newbee account so we can process your erasure request..."
                    : "How can our team help you?"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>

            {topic === "deletion" && (
              <div className="nk-notice-coral">
                <strong>Privacy Routing:</strong> Account and personal data
                deletion requests are routed directly to our Data Protection
                team at <strong>privacy@beeyondapps.com</strong> and processed in
                accordance with GDPR Art. 17 &amp; KVKK Art. 11.
              </div>
            )}

            <button type="submit" className="nk-submit-btn">
              <span>
                {topic === "deletion"
                  ? "Compose Request to privacy@beeyondapps.com →"
                  : "Compose Message to info@beeyondapps.com →"}
              </span>
            </button>

            {submitted && (
              <div className="nk-notice">
                Your email client has been opened with your pre-filled message.
                You can also write directly to{" "}
                <strong>
                  {topic === "deletion"
                    ? "privacy@beeyondapps.com"
                    : "info@beeyondapps.com"}
                </strong>
                .
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
