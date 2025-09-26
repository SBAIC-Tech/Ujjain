import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = ({ 
  children, 
  activeRoute, 
  onNavigate, 
  user, 
  onLogout, 
  notifications = [],
  userRole = 'admin' 
}) => {
  const { colors } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <Header
        user={user}
        onLogout={onLogout}
        notifications={notifications}
        userRole={userRole}
        onMenuToggle={handleSidebarToggle}
        isMobile={isMobile}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeRoute={activeRoute}
          onNavigate={onNavigate}
          userRole={userRole}
          isMobile={isMobile}
          isOpen={isMobile ? mobileMenuOpen : sidebarOpen}
          onToggle={handleSidebarToggle}
        />

        {/* Main Content */}
        <main 
          className="flex-1 overflow-auto"
          style={{ 
            backgroundColor: colors.background,
            paddingBottom: isMobile ? '64px' : '0' // Add space for mobile bottom nav
          }}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation Spacer */}
      {isMobile && <div className="h-16 lg:hidden" />}
    </div>
  );
};

export default Layout;