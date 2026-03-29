import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation change on mobile
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="dashboard-layout relative flex w-full overflow-x-hidden min-h-screen bg-[var(--bg-primary)]">
      
      {/* Mobile Header (Fixed Top) */}
      <div className="md:hidden fixed top-0 inset-x-0 h-[64px] bg-[rgba(5,8,22,0.95)] backdrop-blur-md border-b border-[var(--border)] z-[990] flex items-center justify-between px-4 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--gradient)] flex items-center justify-center text-sm shadow-lg text-white">
            🎓
          </div>
          <span className="font-bold text-lg text-white tracking-wide">ExamAI</span>
        </div>
        <button 
          className="p-2 w-10 h-10 flex items-center justify-center text-white bg-[rgba(255,255,255,0.05)] rounded-lg border border-[var(--border)] active:scale-95 transition-transform"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <span className="text-xl leading-none">☰</span>
        </button>
      </div>

      {/* Sidebar - Hidden on mobile, flex on md+ screens */}
      <div className="hidden md:flex w-[260px] flex-shrink-0 relative z-[100]">
        <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Slide-in Overlay Sidebar for Mobile */}
      <div 
        className={`fixed inset-y-0 left-0 w-[280px] z-[1000] transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} isMobileOverlay={true} />
      </div>

      {/* Mobile Backdrop Overlay - closes sidebar when clicked outside */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area - padded top on mobile to clear the header */}
      <div className="dashboard-main flex-1 w-full max-w-full overflow-x-hidden pt-[84px] md:pt-0 pb-8 sm:px-6 md:px-8">
        <Outlet />
      </div>
      
    </div>
  );
}
