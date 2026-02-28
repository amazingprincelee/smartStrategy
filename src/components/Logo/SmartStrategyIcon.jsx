import React from 'react';

/**
 * SmartStrategy brand icon — two interlocking diamond outlines
 * (teal top-left, green bottom-right) with upward arrow chevrons.
 * Uses stroke-only diamonds (no SVG gradient IDs) so it's safe to
 * render in both Header and Sidebar without ID clashes.
 */
const SmartStrategyIcon = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Top-left diamond — teal */}
    <path
      d="M11 2 L22 13 L11 24 L0 13 Z"
      fill="rgba(6,182,212,0.15)"
      stroke="#06B6D4"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />

    {/* Bottom-right diamond — green */}
    <path
      d="M33 20 L44 31 L33 42 L22 31 Z"
      fill="rgba(34,197,94,0.15)"
      stroke="#22C55E"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />

    {/* Arrow chevron 1 (solid) */}
    <polyline
      points="27,8 33,2 39,8"
      stroke="#22C55E"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Arrow chevron 2 (faded) */}
    <polyline
      points="27,15 33,9 39,15"
      stroke="#22C55E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.4"
    />
  </svg>
);

export default SmartStrategyIcon;
