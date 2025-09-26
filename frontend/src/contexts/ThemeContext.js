import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// AiChecked Color Palette
export const colors = {
  primary: '#D0021B',        // Main logo red
  accent: '#FF6F20',         // Accent orange  
  accentAlt: '#FF4500',      // Alternative accent
  neutral: '#B6B6B6',        // Light neutral
  background: '#F1F3F4',     // Soft background
  darkSlate: '#3B3B3B',      // Dark slate/sidebars
  alertRed: '#C0392B',       // Alert red
  successGreen: '#4CAF50',   // Success green
  okGreen: '#7ED321',        // Alert/ok green
  darkText: '#333333',       // Main dark text
  white: '#FFFFFF',
  black: '#000000'
};

// Theme configurations
export const lightTheme = {
  name: 'light',
  colors: {
    background: colors.background,
    backgroundAlt: colors.white,
    surface: colors.white,
    surfaceAlt: colors.neutral,
    surfaceVariant: '#FAFAFA',
    text: colors.darkText,
    textSecondary: colors.darkSlate,
    textMuted: colors.neutral,
    heading: '#000000',  // Pure black for headings
    border: '#E0E0E0',
    divider: '#F0F0F0',
    
    // Header & Navigation
    header: colors.white,
    sidebar: colors.white,
    sidebarAlt: '#FAFAFA',
    sidebarActive: colors.accentAlt,
    sidebarText: colors.darkText,
    sidebarTextActive: colors.white,
    
    // Cards & Components
    card: colors.white,
    cardAlt: '#FAFBFC',
    cardBorder: '#E8E8E8',
    cardShadow: '0 2px 4px rgba(0,0,0,0.1)',
    
    // Tabs & Active States
    tabActive: colors.accentAlt,
    tabBackground: colors.background,
    tabBackgroundAlt: '#F8F9FA',
    
    // Buttons
    buttonPrimary: colors.accentAlt,
    buttonPrimaryText: colors.white,
    buttonSecondary: colors.accent,
    buttonSuccess: colors.successGreen,
    buttonDanger: colors.alertRed,
    buttonText: colors.darkText,
    
    // Status Colors
    success: colors.successGreen,
    warning: colors.accent,
    danger: colors.alertRed,
    info: '#2196F3'
  }
};

export const darkTheme = {
  name: 'dark',
  colors: {
    background: colors.darkSlate,
    backgroundAlt: '#2A2A2A',
    surface: colors.darkText,
    surfaceAlt: '#404040',
    surfaceVariant: '#2A2A2A',
    text: colors.white,
    textSecondary: colors.background,
    textMuted: colors.neutral,
    heading: '#FFFFFF',  // Pure white for headings
    border: '#4A4A4A',
    divider: '#2A2A2A',
    
    // Header & Navigation
    header: colors.darkText,
    sidebar: colors.darkSlate,
    sidebarAlt: '#2A2A2A',
    sidebarActive: colors.accentAlt,
    sidebarText: colors.neutral,
    sidebarTextActive: colors.white,
    
    // Cards & Components
    card: colors.darkText,
    cardAlt: '#404040',
    cardBorder: '#4A4A4A',
    cardShadow: '0 2px 8px rgba(0,0,0,0.3)',
    
    // Tabs & Active States
    tabActive: colors.accentAlt,
    tabBackground: colors.darkSlate,
    tabBackgroundAlt: '#2A2A2A',
    
    // Buttons
    buttonPrimary: colors.accentAlt,
    buttonPrimaryText: colors.white,
    buttonSecondary: colors.accent,
    buttonSuccess: colors.successGreen,
    buttonDanger: colors.alertRed,
    buttonText: colors.white,
    
    // Status Colors
    success: colors.successGreen,
    warning: colors.accent,
    danger: colors.alertRed,
    info: '#64B5F6'
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('aichecked-theme');
    return saved ? JSON.parse(saved) : false;
  });

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev;
      localStorage.setItem('aichecked-theme', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    root.style.setProperty('--theme-name', theme.name);
  }, [theme]);

  const contextValue = {
    theme,
    isDark,
    toggleTheme,
    colors: theme.colors
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={`theme-${theme.name}`} style={{ 
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
export default ThemeContext;