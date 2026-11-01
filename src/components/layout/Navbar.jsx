import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  WifiOff,
  Download,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWA } from '../../hooks/usePWA';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function Navbar({ onOpenMobile }) {
  const location = useLocation();
  const { currentUser, roles } = useAuth();
  const { resetAllData } = useData();
  const { isDark, toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const { isInstallable, installApp } = usePWA();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Personal Dashboard';
      case '/income':
        return 'Income';
      case '/expenses':
        return 'Expenses';
      case '/learnings':
        return 'Learning Progress';
      case '/users':
        return 'Users';
      case '/permissions':
        return 'Permissions';
      default:
        return 'FocusHub V1';
    }
  };

  const currentRoleName =
    roles.find((r) => r.id === currentUser?.role)?.name || currentUser?.role || 'User';

  const handleResetData = async () => {
    setResetting(true);
    await resetAllData();
    setResetting(false);
    setIsResetConfirmOpen(false);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors duration-150">
      {/* Left: Mobile menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Actions, Offline badge, Theme toggle, PWA install & user */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Offline Badge */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-pulse">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline Mode</span>
          </div>
        )}

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          aria-label="Toggle color theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* PWA Install Button */}
        {isInstallable && (
          <Button
            size="sm"
            variant="outline"
            icon={Download}
            onClick={installApp}
            className="hidden sm:inline-flex"
          >
            Install App
          </Button>
        )}

        {/* Reset / Clear Data */}
        <Button
          size="sm"
          variant="ghost"
          icon={RotateCcw}
          onClick={() => setIsResetConfirmOpen(true)}
          title="Reset application to clean state"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <span className="hidden md:inline">Reset</span>
        </Button>

        {/* Active User */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={currentUser?.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
          />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {currentUser?.name}
            </p>
            <p className="text-2xs text-slate-500 dark:text-slate-400 font-medium">
              {currentRoleName}
            </p>
          </div>
        </div>
      </div>

      {/* Reset confirmation dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset Application Data?"
        message="This will clear your records and reset FocusHub V1 to a clean state. Are you sure?"
        confirmText="Confirm Reset"
        confirmVariant="danger"
        loading={resetting}
      />
    </header>
  );
}
