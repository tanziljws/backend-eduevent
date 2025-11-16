import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { logout, user } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const WARNING_DURATION = 30 * 1000; // 30 seconds warning before logout

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Only set timer if user is logged in
    if (user) {
      // Set warning timer (4.5 minutes)
      warningTimeoutRef.current = setTimeout(() => {
        const shouldContinue = window.confirm(
          'Sesi Anda akan berakhir dalam 30 detik karena tidak ada aktivitas. Klik OK untuk melanjutkan sesi.'
        );
        
        if (shouldContinue) {
          resetTimer(); // Reset timer if user wants to continue
        } else {
          // User chose to logout or didn't respond
          handleLogout();
        }
      }, TIMEOUT_DURATION - WARNING_DURATION);

      // Set main logout timer (5 minutes)
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, TIMEOUT_DURATION);
    }
  };

  const handleLogout = () => {
    alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 5 menit. Silakan login kembali.');
    logout();
  };

  const handleActivity = () => {
    resetTimer();
  };

  useEffect(() => {
    // List of events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start timer when component mounts and user is logged in
    if (user) {
      resetTimer();
    }

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user]);

  // Reset timer when user changes (login/logout)
  useEffect(() => {
    if (user) {
      resetTimer();
    } else {
      // Clear timers when user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    }
  }, [user]);

  const value = {
    resetTimer,
    handleActivity
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
