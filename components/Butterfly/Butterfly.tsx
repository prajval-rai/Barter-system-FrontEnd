"use client";

import { useEffect, useState, useRef, RefObject } from "react";
import styles from "./Butterfly.module.css";

type Props = {
  innerRef: RefObject<HTMLDivElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
  heartRef: RefObject<HTMLSpanElement | null>;
  plantRef: RefObject<HTMLDivElement | null>;
};

function relPoint(container: DOMRect, target: DOMRect, xFrac = 0.5, yFrac = 0.5) {
  return {
    x: target.left - container.left + target.width * xFrac,
    y: target.top - container.top + target.height * yFrac,
  };
}

function Wings() {
  return (
    <svg viewBox="0 0 40 30" width="26" height="18">
      <g className={styles.wingLeft}>
        <path d="M20 15 C10 0, -5 2, 2 14 C6 20, 16 18, 20 15Z" fill="var(--color-primary)" opacity="0.85" />
      </g>
      <g className={styles.wingRight}>
        <path d="M20 15 C30 0, 45 2, 38 14 C34 20, 24 18, 20 15Z" fill="var(--color-primary)" opacity="0.85" />
      </g>
      <ellipse cx="20" cy="15" rx="1.4" ry="6" fill="var(--color-text-heading)" />
    </svg>
  );
}

export default function Butterflies({ innerRef, headingRef, heartRef, plantRef }: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    function measure() {
      const container = innerRef.current?.getBoundingClientRect();
      const heading = headingRef.current?.getBoundingClientRect();
      const heart = heartRef.current?.getBoundingClientRect();
      const plant = plantRef.current?.getBoundingClientRect();
      if (!container || !heading || !heart || !plant) return;

      const mobile = window.innerWidth <= 960;
      setIsMobile(mobile);

      const start = relPoint(container, heading, 0.15, 0.3);
      const mid = relPoint(container, heart, 0.5, 0.4);
      // land on the upper-right area of the plant graphic (leaves), not dead center
      const end = relPoint(container, plant, 0.82, 0.28);

      if (mobile) {
        // single short loop confined to the text block, no cross-column travel
        const a = relPoint(container, heading, 0.1, 0.2);
        const b = relPoint(container, heart, 0.5, 0.5);
        const p1 = `M ${a.x},${a.y} C ${a.x + 60},${a.y - 30} ${b.x - 40},${b.y - 40} ${b.x},${b.y} S ${a.x + 30},${a.y + 40} ${a.x},${a.y} Z`;
        setPaths([p1]);
        return;
      }

      const p1 = `M ${start.x},${start.y} C ${start.x + 100},${start.y - 40} ${mid.x - 80},${mid.y - 30} ${mid.x},${mid.y} S ${start.x + 200},${start.y + 60} ${start.x},${start.y} Z`;

      const p2 = `M ${mid.x},${mid.y} C ${mid.x + 150},${mid.y - 20} ${end.x - 300},${end.y - 80} ${end.x - 150},${end.y - 20} S ${end.x},${end.y} ${end.x - 30},${end.y + 30} S ${mid.x + 80},${mid.y + 60} ${mid.x},${mid.y} Z`;

      const p3 = `M ${start.x - 20},${start.y + 40} C ${(start.x + end.x) / 2},${start.y + 100} ${end.x - 200},${end.y + 60} ${end.x},${end.y} S ${end.x + 20},${end.y - 40} ${end.x - 60},${end.y - 60} S ${(start.x + end.x) / 2 - 100},${start.y + 20} ${start.x - 20},${start.y + 40} Z`;

      setPaths([p1, p2, p3]);
    }

    measure();

    const ro = new ResizeObserver(() => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    });
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener("resize", measure);

    // re-measure once fonts/images settle
    const t = setTimeout(measure, 300);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      clearTimeout(t);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [innerRef, headingRef, heartRef, plantRef]);

  if (paths.length === 0) return null;

  return (
    <div className={styles.flightLayer} aria-hidden="true">
      {paths.map((d, i) => (
        <div
          key={i}
          className={styles.butterfly}
          style={{
            offsetPath: `path('${d}')`,
            animationDuration: `${18 + i * 4}s`,
            animationDelay: `${-i * 5}s`,
          }}
        >
          <Wings />
        </div>
      ))}
    </div>
  );
}