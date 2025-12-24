import { useId } from 'react';

interface ClarioLogoProps {
  className?: string;
  size?: number;
}

export default function ClarioLogo({ className = '', size = 28 }: ClarioLogoProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      width={size}
      height={size * 1.2}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      {/* Geometric fingerprint ridge pattern - angular/octagonal design */}
      <g stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Outer ridge 1 (outermost) */}
        <path d="M 15 55 L 15 35 L 25 18 L 50 8 L 75 18 L 85 35 L 85 55" />

        {/* Outer ridge 2 */}
        <path d="M 20 58 L 20 38 L 28 23 L 50 14 L 72 23 L 80 38 L 80 58" />

        {/* Outer ridge 3 */}
        <path d="M 25 61 L 25 42 L 32 28 L 50 20 L 68 28 L 75 42 L 75 61" />

        {/* Middle octagonal ridges */}
        <path d="M 30 64 L 30 48 L 38 36 L 50 30 L 62 36 L 70 48 L 70 64" />
        <path d="M 35 66 L 35 52 L 42 42 L 50 38 L 58 42 L 65 52 L 65 66" />

        {/* Center octagonal core */}
        <path d="M 40 68 L 40 58 L 45 50 L 50 48 L 55 50 L 60 58 L 60 68 L 55 74 L 50 76 L 45 74 Z" />
        <path d="M 44 66 L 44 60 L 47 55 L 50 54 L 53 55 L 56 60 L 56 66 L 53 70 L 50 71 L 47 70 Z" />

        {/* Lower ridges - converging downward */}
        <path d="M 18 58 L 18 75 L 30 95 L 50 108 L 70 95 L 82 75 L 82 58" />
        <path d="M 24 62 L 24 72 L 34 88 L 50 98 L 66 88 L 76 72 L 76 62" />
        <path d="M 30 65 L 30 70 L 38 82 L 50 90 L 62 82 L 70 70 L 70 65" />
      </g>

      {/* Minutiae points - white fill with dark outline */}
      <g>
        <circle cx="25" cy="32" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="72" cy="28" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="18" cy="58" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="80" cy="52" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="32" cy="88" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="66" cy="92" r="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
