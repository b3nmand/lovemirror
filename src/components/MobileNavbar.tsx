import React from "react";
import { Button } from "@/components/ui/button";

export function MobileNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-3 sm:px-4 h-14 shadow-md bg-white/90 backdrop-blur-md border-b border-gray-200 block lg:hidden"
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
        className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
        aria-label="Open menu"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-gray-700"
        >
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </Button>
    </nav>
  );
}

export default MobileNavbar; 