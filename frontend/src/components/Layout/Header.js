import React from 'react';
import { Bell, Sun, Moon, User, LogOut, Settings, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const IndianEmblem = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://customer-assets.emergentagent.com/job_urbanresponse/artifacts/spgsw74p_indlogo.jpg"
    alt="Government of India"
    className={`${className} object-contain rounded-full shadow-sm`}
    style={{ filter: 'brightness(1.1) contrast(1.1)' }}
  />
);

const Header = ({ user, onLogout, notifications = [], userRole = 'admin' }) => {
  const { theme, isDark, toggleTheme, colors } = useTheme();

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const roleIcons = {
    admin: Shield,
    operator: Settings,
    responder: User
  };

  const RoleIcon = roleIcons[userRole] || User;

  return (
    <header 
      className="h-16 border-b flex items-center justify-between px-6 sticky top-0 z-50"
      style={{ 
        backgroundColor: colors.header,
        borderColor: colors.border,
        boxShadow: theme.name === 'dark' ? colors.cardShadow : '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      {/* Left side - Logo */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          {/* AiChecked Logo - Dynamic based on theme */}
          <img 
            src={isDark 
              ? "https://customer-assets.emergentagent.com/job_urbanresponse/artifacts/1ey8mlei_aichecked-high-resolution-logo-transparent%20%281%29.png"
              : "https://customer-assets.emergentagent.com/job_emergency-dash-3/artifacts/ii4up7zh_aichecked-high-resolution-logo-transparent.png"
            }
            alt="AiChecked"
            className="h-8 w-auto object-contain transition-all duration-300"
            style={{ 
              filter: isDark 
                ? 'brightness(1.2) contrast(1.1)' 
                : 'brightness(1.0) contrast(1.0)',
              opacity: 1
            }}
          />
          <div className="hidden md:flex flex-col">
            <span 
              className="text-lg font-bold transition-colors duration-300"
              style={{ color: isDark ? '#FFFFFF' : '#000000' }}
            >
              AiChecked
            </span>
            <span 
              className="text-xs font-medium transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              Smart City Emergency Management
            </span>
          </div>
        </div>
      </div>

      {/* Center - System Status (Desktop only) */}
      <div className="hidden lg:flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span 
            className="text-sm font-medium"
            style={{ color: colors.textSecondary }}
          >
            System Online
          </span>
        </div>
        <div 
          className="h-4 w-px"
          style={{ backgroundColor: colors.divider }}
        ></div>
        <span 
          className="text-sm"
          style={{ color: colors.textMuted }}
        >
          Ujjain Simhastha 2028
        </span>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="min-h-[44px] w-[44px] p-0 hover:bg-opacity-10"
          style={{ 
            color: colors.textSecondary,
            backgroundColor: 'transparent'
          }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] w-[44px] p-0 hover:bg-opacity-10"
            style={{ 
              color: colors.textSecondary,
              backgroundColor: 'transparent'
            }}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold"
                style={{ 
                  backgroundColor: colors.danger,
                  color: colors.white,
                  border: 'none'
                }}
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Badge>
            )}
          </Button>
        </div>

        {/* User Role & Profile */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex flex-col items-end">
            <span 
              className="text-sm font-medium capitalize"
              style={{ color: colors.text }}
            >
              {user?.name || 'Admin User'}
            </span>
            <span 
              className="text-xs capitalize"
              style={{ color: colors.textSecondary }}
            >
              {userRole} • {user?.zone || 'All Zones'}
            </span>
          </div>
          
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-full border-2"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.sidebarActive
            }}
          >
            <RoleIcon 
              className="w-5 h-5" 
              style={{ color: colors.sidebarActive }}
            />
          </div>
        </div>

        {/* Indian Government Emblem */}
        <IndianEmblem className="w-8 h-8" />

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="min-h-[44px] w-[44px] p-0 hover:bg-opacity-10 text-red-600 hover:text-red-700"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;