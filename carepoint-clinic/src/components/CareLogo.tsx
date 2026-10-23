import React from "react";

interface CareLogoMarkProps {
  className?: string;
  size?: number | string;
  hasBackground?: boolean;
}

/**
 * CareLogoMark
 * Distinctive medical & healthcare emblem centered around "Care" & "Point":
 * - The embracing "C" ribbon signifies compassion, patient care, and human warmth.
 * - The crisp clinical cross represents medical excellence and wellness.
 * - The precision core point and beacon node embody "Point" — pinpoint healthcare and booking.
 */
export function CareLogoMark({
  className = "",
  size = 36,
  hasBackground = true,
}: CareLogoMarkProps) {
  const gradientId = React.useId();
  const bgId = `${gradientId}-bg`;
  const arcId = `${gradientId}-arc`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d5c57" />
          <stop offset="100%" stopColor="#073b37" />
        </linearGradient>
        <linearGradient id={arcId} x1="8" y1="8" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      {hasBackground ? (
        <>
          <rect width="48" height="48" rx="11" fill={`url(#${bgId})`} />
          <rect
            x="0.5"
            y="0.5"
            width="47"
            height="47"
            rx="10.5"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
        </>
      ) : null}

      {/* Protective "C" Arc for Care */}
      <path
        d="M 31 13 A 13.5 13.5 0 1 0 31 35"
        stroke={hasBackground ? `url(#${arcId})` : "#0d5c57"}
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* Clinical Medical Cross */}
      <rect
        x="20.5"
        y="16"
        width="4.5"
        height="16"
        rx="2.25"
        fill={hasBackground ? "#ffffff" : "#0d5c57"}
      />
      <rect
        x="15"
        y="21.75"
        width="15.5"
        height="4.5"
        rx="2.25"
        fill={hasBackground ? "#ffffff" : "#0d5c57"}
      />

      {/* The Focal "Point" Center Core */}
      <circle cx="22.75" cy="24" r="2.2" fill={hasBackground ? "#0d5c57" : "#ffffff"} />

      {/* Precision Accent Node ("CarePoint" Beacon) */}
      <circle cx="34" cy="13" r="2.2" fill={hasBackground ? "#5eead4" : "#14b8a6"} />
    </svg>
  );
}

interface CarePointLogoProps {
  className?: string;
  markSize?: number;
  subtitle?: string;
}

/**
 * CarePointLogo
 * Full brand mark + typography lockup
 */
export function CarePointLogo({
  className = "",
  markSize = 38,
  subtitle = "Appointment Booking",
}: CarePointLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div className="shrink-0 transition-transform duration-200 hover:scale-105">
        <CareLogoMark size={markSize} />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate font-serif text-lg font-semibold tracking-tight">
          Care<span className="text-brand-600">Point</span>{" "}
          <span className="font-sans text-base font-medium opacity-90">Clinic</span>
        </p>
        {subtitle && (
          <p className="truncate text-[11px] font-medium uppercase tracking-widest text-muted">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default CarePointLogo;
