import React from "react";

interface CareLogoMarkProps {
  className?: string;
  size?: number | string;
  hasBackground?: boolean;
}

/**
 * CareLogoMark
 * Medical emblem: embracing "C" ribbon for care, clinical cross for precision,
 * focal point and beacon node for CarePoint.
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
        stroke={hasBackground ? `url(#${arcId})` : "#14b8a6"}
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
        fill={hasBackground ? "#ffffff" : "#14b8a6"}
      />
      <rect
        x="15"
        y="21.75"
        width="15.5"
        height="4.5"
        rx="2.25"
        fill={hasBackground ? "#ffffff" : "#14b8a6"}
      />

      {/* The Focal "Point" Center Core */}
      <circle cx="22.75" cy="24" r="2.2" fill={hasBackground ? "#0d5c57" : "#ffffff"} />

      {/* Precision Accent Node */}
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
  markSize = 36,
  subtitle = "Appointment booking",
}: CarePointLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <div className="shrink-0">
        <CareLogoMark size={markSize} />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-lg font-semibold tracking-tight text-text-primary">
          Care<span className="text-brand-400">Point</span>{" "}
          <span className="text-base font-medium text-text-secondary">Clinic</span>
        </p>
        {subtitle && (
          <p className="truncate text-xs font-medium uppercase tracking-widest text-text-tertiary">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default CarePointLogo;
