import React from "react";
import { Button } from "@/components/ui/button";

export function MobileNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-14 shadow-md bg-white/90 backdrop-blur-md border-b border-gray-200 block lg:hidden"
      style={{
        background: "rgba(255,255,255,0.92)",
        WebkitBackdropFilter: "blur(6px)",
        backdropFilter: "blur(6px)",
      }}
    >
      <span
        className="text-xl font-bold"
        style={{
          background: "linear-gradient(90deg, #e75480 0%, #a259f7 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Love Mirror
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Open menu"
      >
        <svg width="32" height="32" fill="none" stroke="#666" strokeWidth="3" viewBox="0 0 24 24">
          <rect width="24" height="24" fill="none"/>
          {/* Outer bars */}
          <line x1="3" y1="5" x2="21" y2="5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <line x1="3" y1="19" x2="21" y2="19" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          {/* Inner bars */}
          <line x1="5" y1="7" x2="19" y2="7" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <line x1="5" y1="17" x2="19" y2="17" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </Button>
    </nav>
  );
}

export default MobileNavbar; 