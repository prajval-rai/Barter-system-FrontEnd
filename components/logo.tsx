"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LenDenLogo({ width = 280 }: { width?: number }) {
  const { user } = useAuth();
  const href = user ? "/swap" : "/";

  // height scales proportionally with the same aspect ratio as the source image,
  // so passing a smaller width actually shrinks the logo
  const height = width * 0.146 * 1.4; // adjust multiplier to match your logo.png's actual aspect ratio

  return (
    <Link
      href={href}
      style={{ display: "inline-flex", alignItems: "center", width }}
    >
      <Image
        src="/logo.png"
        alt="LenDen"
        width={width}
        height={height}
        style={{ width: "100%", height: "auto" }}
        priority
      />
    </Link>
  );
}
