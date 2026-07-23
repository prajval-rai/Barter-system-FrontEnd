import Image from "next/image";

export default function LenDenLogo({ width = 280 }: { width?: number }) {
  // height scales proportionally with the same aspect ratio as the source image,
  // so passing a smaller width actually shrinks the logo
  const height = width * 0.146 * 1.4; // adjust multiplier to match your logo.png's actual aspect ratio

  return (
    <div style={{ display: "inline-flex", alignItems: "center", width }}>
      <Image
        src="/logo.png"
        alt="LenDen"
        width={width}
        height={height}
        style={{ width: "100%", height: "auto" }}
        priority
      />
    </div>
  );
}
