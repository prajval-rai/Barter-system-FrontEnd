const STEPS = [
  {
    number: 1,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: 'List Your Item',
    desc: 'Upload what you want to exchange in a few simple steps.',
  },
  {
    number: 2,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
    title: 'Find a Match',
    desc: 'We find the best match based on your item & preferences.',
  },
  {
    number: 3,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="0.8" fill="#1A56DB" stroke="none" />
        <circle cx="12" cy="10" r="0.8" fill="#1A56DB" stroke="none" />
        <circle cx="15" cy="10" r="0.8" fill="#1A56DB" stroke="none" />
      </svg>
    ),
    title: 'Connect & Chat',
    desc: 'Talk with each other, understand and confirm the exchange.',
  },
  {
    number: 4,
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    title: 'Exchange & Enjoy',
    desc: 'Exchange safely and enjoy what you actually needed.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{
      padding: '60px 0 80px',
      background: '#f8faff',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 40px',
        boxSizing: 'border-box',
      }}>

        {/* Heading */}
        <h2 style={{
          textAlign: 'center',
          fontSize: '1.875rem',
          fontWeight: 800,
          color: '#0C1B35',
          margin: '0 0 48px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: '-0.4px',
        }}>
          How It Works?
        </h2>

        {/* Steps row */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {STEPS.map((step, i) => (
            <>
              {/* ── Step column ── */}
              <div
                key={step.number}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                {/* Icon + badge */}
                <div style={{
                  position: 'relative',
                  width: 80,
                  height: 80,
                  marginBottom: 24,
                  flexShrink: 0,
                }}>
                  {/* Outer ring (light blue border circle) */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '1.5px solid #BFDBFE',
                    opacity: 0.6,
                  }} />
                  {/* Inner filled circle */}
                  <div style={{
                    position: 'absolute',
                    inset: 6,
                    borderRadius: '50%',
                    background: '#EBF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {step.icon}
                  </div>
                  {/* Number badge */}
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#1A56DB',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #f8faff',
                    boxShadow: '0 2px 6px rgba(26,86,219,0.35)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    lineHeight: 1,
                    zIndex: 1,
                  }}>
                    {step.number}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#0C1B35',
                  margin: '0 0 8px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: '-0.2px',
                }}>
                  {step.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: 13.5,
                  color: '#475569',
                  lineHeight: 1.7,
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                  paddingRight: 16,
                }}>
                  {step.desc}
                </p>
              </div>

              {/* ── Arrow connector ── */}
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 80,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: 33,   /* (80 / 2) - (14 / 2) = centers on icon */
                }}>
                  <svg width="80" height="14" viewBox="0 0 80 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="7" x2="65" y2="7" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="5 4" />
                    <polyline points="62,3 72,7 62,11" stroke="#93C5FD" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </>
          ))}
        </div>

      </div>
    </section>
  );
}