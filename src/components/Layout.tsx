import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import MobileNavbar from '@/components/MobileNavbar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { isSubscribed, loading: subscriptionLoading } = useSubscription();

  // Reset sidebar state when route changes (for mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Check if the screen is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navbar */}
      {isMobile && <MobileNavbar onMenuClick={toggleSidebar} />}
      
      {/* Sidebar */}
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onToggle={toggleSidebar}
      />

      {/* Subscription Banner */}
      {!subscriptionLoading && !isSubscribed && (
        <SubscriptionBanner className="pl-0 lg:pl-64" />
      )}

      {/* Main content */}
      <div className="pl-0 lg:pl-64 pb-16 min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}