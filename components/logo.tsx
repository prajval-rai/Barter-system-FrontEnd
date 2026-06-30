export default function LenDenLogo({ width = 280 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', width }}>
      <span
        style={{
          fontFamily: "'Poppins', 'Arial', 'Helvetica Neue', sans-serif",
          fontWeight: 800,
          fontSize: '2.6rem',
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
