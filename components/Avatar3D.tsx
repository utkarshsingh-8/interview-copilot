// Self-contained 3D-style avatar (no external images / network).
// Memoji-like look built with SVG radial gradients + soft shadows.

export default function Avatar3D({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      role="img"
      aria-label="3D avatar"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="av-bg" cx="35%" cy="28%" r="85%">
          <stop offset="0" stopColor="#b3a6f5" />
          <stop offset="0.55" stopColor="#7c6be0" />
          <stop offset="1" stopColor="#5b49c4" />
        </radialGradient>
        <radialGradient id="av-skin" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#f6cea8" />
          <stop offset="0.7" stopColor="#eab389" />
          <stop offset="1" stopColor="#d9986e" />
        </radialGradient>
        <linearGradient id="av-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3140" />
          <stop offset="1" stopColor="#211b28" />
        </linearGradient>
        <linearGradient id="av-shirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b2440" />
          <stop offset="1" stopColor="#1c1830" />
        </linearGradient>
        <filter id="av-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            floodColor="#3c2d78"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* background disc */}
      <circle cx="80" cy="80" r="78" fill="url(#av-bg)" />
      {/* subtle top highlight */}
      <ellipse cx="58" cy="44" rx="42" ry="26" fill="#ffffff" opacity="0.12" />

      <g filter="url(#av-soft)">
        {/* shoulders / shirt */}
        <path
          d="M34 160c0-26 20-42 46-42s46 16 46 42Z"
          fill="url(#av-shirt)"
        />
        {/* collar */}
        <path
          d="M66 122c4 8 24 8 28 0l-6 12h-16Z"
          fill="#ffffff"
          opacity="0.9"
        />

        {/* neck */}
        <path d="M69 104h22v20c0 6-22 6-22 0Z" fill="#dd9c73" />

        {/* ears */}
        <circle cx="52" cy="82" r="8" fill="url(#av-skin)" />
        <circle cx="108" cy="82" r="8" fill="url(#av-skin)" />

        {/* head */}
        <path
          d="M52 74c0-20 12-34 28-34s28 14 28 34-12 36-28 36-28-16-28-36Z"
          fill="url(#av-skin)"
        />

        {/* hair */}
        <path
          d="M50 74c-2-24 12-40 30-40s32 15 30 40c-3-8-6-13-10-16 1 6 0 10-2 13-1-9-4-15-8-18-6 8-24 12-38 8 2 5 1 9-2 13Z"
          fill="url(#av-hair)"
        />

        {/* eyebrows */}
        <path
          d="M63 76c3-2 8-2 11 0M86 76c3-2 8-2 11 0"
          stroke="#2a2230"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* eyes */}
        <ellipse cx="68.5" cy="83" rx="3.1" ry="3.6" fill="#2a2230" />
        <ellipse cx="91.5" cy="83" rx="3.1" ry="3.6" fill="#2a2230" />
        <circle cx="69.6" cy="81.8" r="1" fill="#fff" />
        <circle cx="92.6" cy="81.8" r="1" fill="#fff" />

        {/* nose */}
        <path
          d="M80 86v7c0 2-2 3-4 3"
          stroke="#c8875f"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* smile */}
        <path
          d="M70 98c4 5 16 5 20 0"
          stroke="#a15b45"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
