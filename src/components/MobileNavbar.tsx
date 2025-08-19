import React from "react";
import { Button } from "@/components/ui/button";

export function MobileNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 h-16 sm:h-14 shadow-md bg-white/95 backdrop-blur-md border-b border-gray-200 block lg:hidden"
      style={{
        background: "rgba(255,255,255,0.95)",
        WebkitBackdropFilter: "blur(8px)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center">
        {/* Show image on small screens, text on larger screens */}
        <img 
          src="/homeimage.png" 
          alt="Love Mirror" 
          className="w-10 h-10 sm:hidden"
        />
        <span
          className="hidden sm:block text-lg sm:text-xl font-bold"
          style={{
            background: "linear-gradient(90deg, #e75480 0%, #a259f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Love Mirror
        </span>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden p-3 bg-white hover:bg-gray-50 border-gray-200 rounded-lg touch-manipulation shadow-sm"
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