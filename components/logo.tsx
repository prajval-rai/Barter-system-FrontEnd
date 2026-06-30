export default function LenDenLogo({ width = 280 }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6em',
        width,
      }}
    >
      {/* Icon: two looping arrows, drawn as SVG since CSS can't cleanly do rounded directional arrows */}
      <svg
        viewBox="0 0 100 100"
        width="28%"
        style={{ flexShrink: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* top arrow: navy -> bright blue gradient, pointing right */}
        <path
          d="M20 35 V30 a14 14 0 0 1 14 -14 H55"
          fill="none"
          stroke="url(#topGrad)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <polygon points="50,4 78,16 50,28" fill="#2563ff" />

        {/* bottom arrow: navy, pointing left */}
        <path
          d="M80 65 V70 a14 14 0 0 1 -14 14 H45"
          fill="none"
          stroke="url(#bottomGrad)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <polygon points="50,96 22,84 50,72" fill="#0a1759" />

        <defs>
          <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d3bb0" />
            <stop offset="100%" stopColor="#2563ff" />
          </linearGradient>
          <linearGradient id="bottomGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0a1759" />
            <stop offset="100%" stopColor="#16205e" />
          </linearGradient>
        </defs>
      </svg>

      {/* Wordmark: pure CSS, split-color text */}
      <span
        style={{
          fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
          fontWeight: 800,
          fontSize: '2.4rem',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: '#0a1759' }}>Len</span>
        <span style={{ color: '#2563ff' }}>Den</span>
      </span>
    </div>
  );
}
