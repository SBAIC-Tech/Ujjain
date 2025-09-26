import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './button';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast = ({ toast, onClose }) => {
  const { colors } = useTheme();

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const iconColors = {
    success: colors.success,
    error: colors.danger,
    warning: colors.warning,
    info: colors.info
  };

  const Icon = icons[toast.type] || Info;

  return (
    <div 
      className="flex items-start space-x-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm max-w-md w-full animate-in slide-in-from-right duration-300"
      style={{ 
        backgroundColor: colors.card,
        borderColor: iconColors[toast.type],
        borderWidth: '2px'
      }}
    >
      <Icon 
        className="w-5 h-5 mt-0.5 flex-shrink-0"
        style={{ color: iconColors[toast.type] }}
      />
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div 
            className="text-sm font-semibold mb-1"
            style={{ color: colors.text }}
          >
            {toast.title}
          </div>
        )}
        <div 
          className="text-sm"
          style={{ color: colors.textSecondary }}
        >
          {toast.message}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onClose(toast.id)}
        className="w-5 h-5 p-0 hover:bg-opacity-10 flex-shrink-0"
        style={{ color: colors.textMuted }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

const ToastContainer = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type: 'info',
      duration: 4000,
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, title) => {
    addToast({ type: 'success', message, title });
  }, [addToast]);

  const showError = useCallback((message, title) => {
    addToast({ type: 'error', message, title });
  }, [addToast]);

  const showWarning = useCallback((message, title) => {
    addToast({ type: 'warning', message, title });
  }, [addToast]);

  const showInfo = useCallback((message, title) => {
    addToast({ type: 'info', message, title });
  }, [addToast]);

  const contextValue = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;