export default function LenDenLogo({ width = 280 }: { width?: number }) {
  // font scales proportionally to width instead of being fixed,
  // so passing a smaller width actually shrinks the wordmark
  const fontSize = width * 0.146;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", width }}>
      <span
        style={{
          fontFamily: "'Poppins', 'Arial', 'Helvetica Neue', sans-serif",
          fontWeight: 800,
          fontSize: `${fontSize}px`,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: "#0a1759" }}>Len</span>
        <span style={{ color: "#2563ff" }}>Den</span>
      </span>
    </div>
  );
}
