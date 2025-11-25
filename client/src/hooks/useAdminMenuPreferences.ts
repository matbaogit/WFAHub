import { useState, useEffect } from 'react';

export interface AdminMenuPreferences {
  [menuId: string]: boolean;
}

const STORAGE_KEY = 'wfa-admin-menu-preferences';

const DEFAULT_PREFERENCES: AdminMenuPreferences = {
  'admin-dashboard': true,
  'admin-users': true,
  'admin-templates': true,
  'admin-smtp': true,
  'admin-stats': true,
};

export function useAdminMenuPreferences() {
  const [preferences, setPreferences] = useState<AdminMenuPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new menu items are visible by default
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load admin menu preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save admin menu preferences:', error);
    }
  }, [preferences]);

  const toggleMenuItem = (menuId: string) => {
    setPreferences(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  const isMenuVisible = (menuId: string): boolean => {
    return preferences[menuId] ?? true; // Default to visible if not set
  };

  return {
    preferences,
    toggleMenuItem,
    resetToDefaults,
    isMenuVisible,
  };
}
