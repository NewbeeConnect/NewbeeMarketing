import Link from "next/link";
import { NewbeeLogoMark, NewbeeFooterWordmark } from "./Marks";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="nk-footer">
      <div className="nk-footer-grid">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <NewbeeLogoMark size={26} />
            <span
              style={{
                fontWeight: 600,
                fontSize: 18,
                color: "#111111",
                letterSpacing: "-0.03em",
              }}
            >
              newbee<span style={{ color: "#ffb72a" }}>.</span>
            </span>
          </div>
          <p
            style={{
              margin: "12px 0 0",
              maxWidth: 340,
              lineHeight: 1.6,
              color: "#262521",
            }}
          >
            From &ldquo;Help?!&rdquo; to &ldquo;Heeey!&rdquo; — the community
            and discovery platform for newcomers, expats, and diaspora life in
            Germany. Built by{" "}
            <a
              href="https://www.beeyondapps.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "underline",
                textDecorationColor: "#ffb72a",
                textDecorationThickness: 2,
                fontWeight: 600,
              }}
            >
              Beeyondapps Teknoloji Ltd. Şti.
            </a>
          </p>
        </div>

        <div>
          <div className="nk-footer-col-title">Platform</div>
          <div className="nk-footer-links">
            <a
              href="https://app.newbeeapp.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Newbee Web App ↗
            </a>
            <a
              href="https://apps.apple.com/app/newbee/id6474511885"
              target="_blank"
              rel="noopener noreferrer"
            >
              Newbee on App Store (iOS) ↗
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.beeyondapps.newbee"
              target="_blank"
              rel="noopener noreferrer"
            >
              Newbee on Google Play ↗
            </a>
            <a
              href="https://expert.newbeeapp.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Newbee Expert Portal ↗
            </a>
            <Link href="/download">Direct App Download (/download)</Link>
          </div>
        </div>

        <div>
          <div className="nk-footer-col-title">Community &amp; Ecosystem</div>
          <div className="nk-footer-links">
            <Link href="/communities">Communities &amp; City Leads</Link>
            <Link href="/businesses">Verified Experts &amp; Partners</Link>
            <Link href="/about">About &amp; Backing</Link>
            <a
              href="https://www.instagram.com/newbeeappsocials/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram (@newbeeappsocials) ↗
            </a>
            <a
              href="https://www.linkedin.com/company/newbeeapp/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn ↗
            </a>
          </div>
        </div>

        <div>
          <div className="nk-footer-col-title">Legal &amp; Support</div>
          <div className="nk-footer-links">
            <Link href="/privacy">Privacy Policy &amp; KVKK</Link>
            <Link href="/termsandconditions">Terms &amp; Conditions</Link>
            <Link href="/contact">Contact &amp; Account Deletion</Link>
            <a href="mailto:info@beeyondapps.com">info@beeyondapps.com</a>
            <a href="mailto:privacy@beeyondapps.com">privacy@beeyondapps.com</a>
          </div>
        </div>
      </div>

      <NewbeeFooterWordmark />

      <div className="nk-footer-bottom">
        <span>
          © {year} Newbee · BEEYONDAPPS TEKNOLOJİ LİMİTED ŞİRKETİ. All rights
          reserved.
        </span>
        <span>
          Frankfurt am Main · backed by Frankfurt School Accelerator, Hessen
          Ideen &amp; Google for Startups
        </span>
      </div>
    </footer>
  );
}
