import React, { useState } from 'react';
import { 
  Home, AlertTriangle, Camera, MapPin, Users, 
  Bell, BarChart3, Activity, Menu, X, ChevronRight 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const navigationItems = {
  admin: [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
    { id: 'incidents', icon: AlertTriangle, label: 'Incident Center', path: '/dashboard/incidents', badge: 5 },
    { id: 'devices', icon: Camera, label: 'Devices & Cameras', path: '/dashboard/devices' },
    { id: 'zones', icon: MapPin, label: 'Zone Management', path: '/dashboard/zones' },
    { id: 'users', icon: Users, label: 'User Management', path: '/dashboard/users' },
    { id: 'alerts', icon: Bell, label: 'Alerts & Notifications', path: '/dashboard/alerts', badge: 3 },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { id: 'system', icon: Activity, label: 'System Health', path: '/dashboard/system-health' }
  ],
  operator: [
    { id: 'dashboard', icon: Home, label: 'Zone Dashboard', path: '/dashboard' },
    { id: 'incidents', icon: AlertTriangle, label: 'Zone Incidents', path: '/dashboard/incidents', badge: 2 },
    { id: 'devices', icon: Camera, label: 'Zone Devices', path: '/dashboard/devices' },
    { id: 'alerts', icon: Bell, label: 'Zone Alerts', path: '/dashboard/alerts', badge: 1 },
    { id: 'analytics', icon: BarChart3, label: 'Zone Analytics', path: '/dashboard/analytics' }
  ],
  responder: [
    { id: 'dashboard', icon: Home, label: 'My Dashboard', path: '/dashboard' },
    { id: 'incidents', icon: AlertTriangle, label: 'Assigned Incidents', path: '/dashboard/incidents', badge: 3 },
    { id: 'alerts', icon: Bell, label: 'My Alerts', path: '/dashboard/alerts', badge: 2 }
  ]
};

const Sidebar = ({ activeRoute, onNavigate, userRole = 'admin', isMobile = false, isOpen = true, onToggle }) => {
  const { colors, isDark } = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  const items = navigationItems[userRole] || navigationItems.admin;

  const handleItemClick = (item) => {
    onNavigate(item.id);
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Bottom Navigation */}
        <nav 
          className="fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around z-50 lg:hidden"
          style={{ 
            backgroundColor: colors.header,
            borderColor: colors.border
          }}
        >
          {items.slice(0, 5).map((item) => {
            const isActive = activeRoute === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="flex flex-col items-center justify-center min-w-0 flex-1 p-2 relative"
                style={{ 
                  minHeight: '44px'
                }}
              >
                <div className="relative">
                  <Icon 
                    className="w-5 h-5 mb-1"
                    style={{ 
                      color: isActive ? colors.sidebarActive : colors.sidebarText 
                    }}
                  />
                  {item.badge && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                      style={{ 
                        backgroundColor: colors.danger,
                        color: colors.white,
                        fontSize: '10px'
                      }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span 
                  className="text-xs font-medium truncate max-w-full"
                  style={{ 
                    color: isActive ? colors.sidebarActive : colors.sidebarText,
                    fontSize: '10px'
                  }}
                >
                  {item.label.split(' ')[0]}
                </span>
                {isActive && (
                  <div 
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-b"
                    style={{ backgroundColor: colors.sidebarActive }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onToggle} />
            <div 
              className="absolute left-0 top-0 bottom-0 w-80 p-4"
              style={{ 
                backgroundColor: colors.sidebar,
                borderColor: colors.border
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <img 
                  src={isDark 
                    ? "https://customer-assets.emergentagent.com/job_urbanresponse/artifacts/1ey8mlei_aichecked-high-resolution-logo-transparent%20%281%29.png"
                    : "https://customer-assets.emergentagent.com/job_emergency-dash-3/artifacts/ii4up7zh_aichecked-high-resolution-logo-transparent.png"
                  }
                  alt="AiChecked"
                  className="h-8 w-auto object-contain"
                  style={{ 
                    filter: isDark 
                      ? 'brightness(1.2) contrast(1.1)' 
                      : 'brightness(1.0) contrast(1.0)',
                    opacity: 1
                  }}
                />
                <Button variant="ghost" size="sm" onClick={onToggle}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="space-y-2">
                {items.map((item) => {
                  const isActive = activeRoute === item.id;
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200"
                      style={{
                        backgroundColor: isActive ? colors.sidebarActive : 'transparent',
                        color: isActive ? colors.sidebarTextActive : colors.sidebarText,
                        minHeight: '44px'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <Badge 
                            className="h-5 w-5 p-0 text-xs flex items-center justify-center"
                            style={{ 
                              backgroundColor: colors.danger,
                              color: colors.white
                            }}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside 
      className={`hidden lg:flex flex-col h-full border-r transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
      style={{ 
        backgroundColor: colors.sidebar,
        borderColor: colors.border
      }}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center space-x-3">
              <img 
                src={isDark 
                  ? "https://customer-assets.emergentagent.com/job_urbanresponse/artifacts/1ey8mlei_aichecked-high-resolution-logo-transparent%20%281%29.png"
                  : "https://customer-assets.emergentagent.com/job_emergency-dash-3/artifacts/ii4up7zh_aichecked-high-resolution-logo-transparent.png"
                }
                alt="AiChecked"
                className="h-8 w-auto object-contain"
                style={{ 
                  filter: isDark 
                    ? 'brightness(1.2) contrast(1.1)' 
                    : 'brightness(1.0) contrast(1.0)',
                  opacity: 1
                }}
              />
              <div className="flex flex-col">
                <span 
                  className="text-sm font-bold"
                  style={{ color: colors.text }}
                >
                  AiChecked
                </span>
                <span 
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  Emergency Center
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={`min-h-[44px] w-[44px] p-0 flex items-center justify-center ${
              !isOpen ? 'mx-auto' : ''
            }`}
            style={{ color: colors.sidebarText }}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const isActive = activeRoute === item.id;
          const isHovered = hoveredItem === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center rounded-lg transition-all duration-200 ${
                isOpen ? 'p-3' : 'p-3 justify-center'
              }`}
              style={{
                backgroundColor: isActive 
                  ? colors.sidebarActive 
                  : isHovered 
                    ? `${colors.sidebarActive}20` 
                    : 'transparent',
                color: isActive ? colors.sidebarTextActive : colors.sidebarText,
                minHeight: '44px'
              }}
              title={!isOpen ? item.label : ''}
            >
              {isOpen ? (
                // Full sidebar layout
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.badge && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                        style={{ 
                          backgroundColor: colors.danger,
                          color: colors.white,
                          fontSize: '10px'
                        }}
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium truncate">{item.label}</span>
                </div>
              ) : (
                // Minimized sidebar layout - centered icon with badge
                <div className="relative flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                      style={{ 
                        backgroundColor: colors.danger,
                        color: colors.white,
                        fontSize: '10px'
                      }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
              )}
              {isOpen && isActive && (
                <div 
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: colors.sidebarTextActive }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Badge - only show when expanded */}
      {isOpen && (
        <div 
          className="p-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <div 
            className="flex items-center space-x-2 p-2 rounded-lg"
            style={{ 
              backgroundColor: `${colors.sidebarActive}10`,
              border: `1px solid ${colors.sidebarActive}30`
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.success }}
            />
            <span 
              className="text-sm font-medium capitalize"
              style={{ color: colors.textSecondary }}
            >
              {userRole} Access
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;