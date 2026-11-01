import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => storageService.getActiveUser());
  const [roles, setRoles] = useState(() => storageService.getRoles());

  // Listen for storage changes if multiple tabs or reset happens
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUser(storageService.getActiveUser());
      setRoles(storageService.getRoles());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (user) => {
    authService.login(user);
    setCurrentUser(user);
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const switchUser = (user) => {
    authService.login(user);
    setCurrentUser(user);
  };

  /**
   * Helper to verify if the active user possesses a permission string.
   * e.g. can('income:create')
   */
  const can = (permissionId) => {
    if (!currentUser) return false;
    return authService.hasPermission(currentUser, permissionId, roles);
  };

  const refreshRoles = () => {
    setRoles(storageService.getRoles());
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    roles,
    refreshRoles,
    login,
    logout,
    switchUser,
    can,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
