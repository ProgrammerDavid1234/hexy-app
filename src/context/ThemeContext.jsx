import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const THEME_KEY = '@hexy_theme';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = {
    dark: {
      background: '#0F172A',
      backgroundSecondary: '#1a1f3a',
      backgroundTertiary: '#0A0E27',
      text: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textTertiary: '#94A3B8',
      border: 'rgba(255, 255, 255, 0.1)',
      primary: '#667EEA',
      primaryDark: '#764BA2',
      card: 'rgba(255, 255, 255, 0.05)',
      input: 'rgba(255, 255, 255, 0.1)',
    },
    light: {
      background: '#FFFFFF',
      backgroundSecondary: '#F8FAFC',
      backgroundTertiary: '#F1F5F9',
      text: '#0F172A',
      textSecondary: '#1E293B',
      textTertiary: '#64748B',
      border: 'rgba(0, 0, 0, 0.1)',
      primary: '#667EEA',
      primaryDark: '#764BA2',
      card: '#FFFFFF',
      input: '#F1F5F9',
    },
  };

  const value = {
    theme,
    colors: colors[theme],
    toggleTheme,
    isDark: theme === 'dark',
  };

  if (isLoading) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

