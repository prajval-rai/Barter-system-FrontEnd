"use client";

import { useEffect, useState } from "react";

export default function WhatsAppFloatButton() {
  const phoneNumber = "918850005260";
  const message = encodeURIComponent("Hi, I have a query regarding LenDen app.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const lastDismissed = localStorage.getItem("wa_tooltip_dismissed_at");
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastDismissed || Date.now() - Number(lastDismissed) > oneDay) {
      const timer = setTimeout(() => setShowTooltip(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissTooltip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(false);
    localStorage.setItem("wa_tooltip_dismissed_at", String(Date.now()));
  };

  return (
    <>
      <div className="wa-float-wrapper">
        {showTooltip && (
          
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-float-tooltip"
          >
            Got feedback? Chat with us 💬
            <button
              onClick={dismissTooltip}
              aria-label="Dismiss"
              className="wa-float-dismiss"
            >
              ✕
            </button>
          </a>
        )}

        
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact developer on WhatsApp"
          className="wa-float-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="white">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.14h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.2 8.2 0 0 1-1.26-4.35c0-4.54 3.7-8.24 8.26-8.24a8.2 8.2 0 0 1 5.84 2.42 8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.26 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.36-.77-1.86-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.41 1.02 2.58c.12.17 1.75 2.68 4.25 3.75.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28z" />
          </svg>
        </a>
      </div>

      <style>{`
        .wa-float-wrapper {
          position: fixed;
          z-index: 40;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          /* Desktop default: no bottom nav / FAB to sit above, so just a
             normal bottom-right corner button */
          bottom: 24px;
          right: 24px;
          left: auto;
          top: auto;
        }

        .wa-float-btn {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border-radius: 50%;
          background-color: #25D366;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        .wa-float-btn:hover {
          transform: scale(1.08);
        }

        .wa-float-tooltip {
          position: relative;
          background-color: #ffffff;
          color: #1a1a1a;
          padding: 10px 32px 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          text-decoration: none;
          animation: wa-tooltip-in 0.25s ease-out;
        }

        .wa-float-dismiss {
          position: absolute;
          top: 2px;
          right: 4px;
          background: none;
          border: none;
          color: #999;
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
        }

        @keyframes wa-tooltip-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Mobile: stacked directly above the "+" FAB, horizontally centered
           on it using measured --fab-right / --fab-width from MobileBottomNav */
        @media (max-width: 640px) {
          .wa-float-wrapper {
            bottom: calc(var(--bottom-nav-height, 76px) + 14px + env(safe-area-inset-bottom, 0px));
            right: calc(var(--fab-right, 16px) - (46px - var(--fab-width, 52px)) / 2);
            left: auto;
            top: auto;
          }
          .wa-float-tooltip {
            white-space: normal;
            max-width: 190px;
          }
        }
      `}</style>
    </>
  );
}
