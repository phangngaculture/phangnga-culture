import React from 'react';

export const GarudaIcon: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ตราครุฑพระราชทาน"
    >
      {/* Royal Thai Garuda silhouette vector */}
      <g fill="#8B0000" stroke="#5a0000" strokeWidth="0.5">
        {/* Crown (ชฎา) */}
        <path d="M50 4 L53 14 L56 18 L50 20 L44 18 L47 14 Z" />
        <path d="M50 1 L51 5 L49 5 Z" />
        {/* Head and face */}
        <circle cx="50" cy="22" r="4.5" />
        <path d="M47 25 L50 30 L53 25 Z" />
        {/* Torso & Armor */}
        <path d="M45 28 C42 34, 42 42, 45 48 L55 48 C58 42, 58 34, 55 28 Z" />
        {/* Left Wing (expanded feathers) */}
        <path d="M44 30 C35 22, 22 18, 8 20 C14 26, 22 34, 30 40 C20 38, 12 40, 6 48 C16 50, 26 52, 34 54 C24 57, 16 63, 10 72 C22 70, 32 66, 42 58 Z" />
        {/* Right Wing (expanded feathers) */}
        <path d="M56 30 C65 22, 78 18, 92 20 C86 26, 78 34, 70 40 C80 38, 88 40, 94 48 C84 50, 74 52, 66 54 C76 57, 84 63, 90 72 C78 70, 68 66, 58 58 Z" />
        {/* Arms */}
        <path d="M44 32 C38 36, 32 38, 28 36 C32 42, 38 43, 44 42 Z" />
        <path d="M56 32 C62 36, 68 38, 72 36 C68 42, 62 43, 56 42 Z" />
        {/* Waist & Tail (หางครุฑ) */}
        <path d="M46 48 L50 66 L54 48 Z" />
        <path d="M50 66 C46 75, 42 85, 38 95 C46 90, 50 86, 50 78 C50 86, 54 90, 62 95 C58 85, 54 75, 50 66 Z" />
        {/* Legs & Talons (กรงเล็บ) */}
        <path d="M43 50 C38 60, 34 72, 32 82 C35 84, 40 82, 42 78 C44 72, 45 64, 46 54 Z" />
        <path d="M57 50 C62 60, 66 72, 68 82 C65 84, 60 82, 58 78 C56 72, 55 64, 54 54 Z" />
        {/* Details and highlights */}
        <circle cx="50" cy="35" r="2.5" fill="#f59e0b" />
        <circle cx="50" cy="42" r="2" fill="#f59e0b" />
      </g>
    </svg>
  );
};
