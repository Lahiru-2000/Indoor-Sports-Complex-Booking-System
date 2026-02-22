import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Session timeout in milliseconds (24 hours = 24 * 60 * 60 * 1000)
const SESSION_TIMEOUT = 1 * 2 * 60 * 1000;

// Check if session has expired
const isSessionExpired = () => {
  const loginTime = localStorage.getItem('loginTimestamp');
  if (!loginTime) return true;
  
  const now = Date.now();
  const timeSinceLogin = now - parseInt(loginTime, 10);
  return timeSinceLogin > SESSION_TIMEOUT;
};

// Clear session data
const clearSession = () => {
  localStorage.removeItem('loginTimestamp');
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session expiration on mount (only if user is already logged in)
    const checkSession = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && isSessionExpired()) {
        console.log('Session expired, signing out...');
        clearSession();
        await signOut(auth);
        window.location.href = '/login';
        return;
      }
    };

    // Only check session if we're not on the login page
    if (window.location.pathname !== '/login') {
      checkSession();
    }

    // Check session when tab becomes visible (user returns to tab)
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const currentUser = auth.currentUser;
        if (currentUser && isSessionExpired()) {
          clearSession();
          await signOut(auth);
          window.location.href = '/login';
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check every 5 minutes
    const intervalId = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser && isSessionExpired()) {
        clearSession();
        await signOut(auth);
        window.location.href = '/login';
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Don't check session expiration during login process
      // Only check if we're not on the login/register page
      const isOnAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      
      if (currentUser && !isOnAuthPage && isSessionExpired()) {
        // Session expired, sign out the user
        console.log('Session expired, signing out...');
        clearSession();
        await signOut(auth);
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      
      if (currentUser) {
        // Update login timestamp if not already set
        if (!localStorage.getItem('loginTimestamp')) {
          localStorage.setItem('loginTimestamp', Date.now().toString());
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData({ ...currentUser, role: userDoc.data().role || 'user' });
          } else {
            // User document doesn't exist, default to user role
            setUserData({ ...currentUser, role: 'user' });
          }
        } catch (error) {
          // Handle permission errors gracefully - user might not have access to their own document
          // or document might not exist yet. Default to user role.
          if (error.code !== 'permission-denied') {
            console.error('Error fetching user data:', error);
          }
          // Default to user role if there's any error
          // This allows the user to still access the app even if Firestore rules aren't deployed
          setUserData({ ...currentUser, role: 'user' });
        }
      } else {
        // User signed out, clear session
        clearSession();
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { user: userData, loading };
};



















