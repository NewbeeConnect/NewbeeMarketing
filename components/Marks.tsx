import type { ReactNode } from "react";

export function NewbeeLogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        overflow: "hidden",
        border: "1.5px solid #111111",
        background: "#ffb72a",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/newbee-logo.png"
        alt="Newbee"
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </span>
  );
}

export function HandDrawnUnderline({ children }: { children: ReactNode }) {
  return (
    <span className="nk-underline-wrap">
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 220 14"
        fill="none"
        preserveAspectRatio="none"
        className="nk-underline-svg"
      >
        <path
          d="M 3 10.5 C 58 3, 148 2.5, 217 8.5"
          stroke="#ffb72a"
          strokeWidth="3.8"
          strokeLinecap="round"
          pathLength={1}
          className="nk-draw"
        />
        <path
          d="M 16 12.2 C 88 7.5, 162 7, 212 11"
          stroke="#111111"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeOpacity="0.85"
          pathLength={1}
          className="nk-draw"
        />
      </svg>
    </span>
  );
}

export function ArrowUpRightBadge() {
  return (
    <span className="nk-cta-badge" aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M3 9L9 3M9 3H4M9 3V8"
          stroke="#ffb72a"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function ArrowUpRightDarkBadge() {
  return (
    <span className="nk-cta-badge-dark" aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M3 9L9 3M9 3H4M9 3V8"
          stroke="#111111"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function NewbeeFooterWordmark() {
  return (
    <svg
      viewBox="0 0 920 140"
      aria-hidden="true"
      className="nk-footer-wordmark"
    >
      <text
        x="0"
        y="112"
        fontFamily="var(--font-marketing-sans), sans-serif"
        fontSize="132"
        fontWeight="600"
        letterSpacing="-7"
        fill="#111111"
      >
        newbee
        <tspan fill="#ffb72a" stroke="#111111" strokeWidth="1.5">
          .
        </tspan>
      </text>
    </svg>
  );
}
