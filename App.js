import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreenExpo from 'expo-splash-screen';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import SplashScreen from './src/SplashScreen/SplashScreen';
import Onboarding from './src/Onboarding/Onboarding';
import Login from './src/Auth/Login';
import Signup from './src/Auth/Signup';
import ChatWindow from './src/Chat/ChatWindow';
import Profile from './src/Profile/Profile';
import { ThemeProvider } from './src/context/ThemeContext';
import { authUtils } from './src/lib/api';

// Keep the splash screen visible while we fetch resources
SplashScreenExpo.preventAutoHideAsync();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Medium': Poppins_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreenExpo.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    checkAuthOnStart();
  }, []);

  const checkAuthOnStart = async () => {
    const authenticated = await authUtils.isAuthenticated();
    setIsAuthenticated(authenticated);
    setHasCheckedAuth(true);
    
    // If authenticated, skip splash and onboarding, go directly to chat
    if (authenticated) {
      setShowSplash(false);
      setShowOnboarding(false);
      setShowChat(true);
    }
  };

  const handleSplashComplete = async () => {
    setShowSplash(false);
    // Check auth again after splash
    const authenticated = await authUtils.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      // Skip onboarding if authenticated
      setShowChat(true);
    } else {
      // Show onboarding for first-time users
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    const authenticated = await authUtils.isAuthenticated();
    if (authenticated) {
      setShowChat(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    setShowAuth(false);
    setShowSignup(false);
    setShowChat(true);
  };

  const handleLogout = async () => {
    await authUtils.clearToken();
    setIsAuthenticated(false);
    setShowChat(false);
    setShowProfile(false);
    setShowAuth(true);
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const handleBackToChatList = () => {
    setCurrentChatId(null);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <View style={styles.container}>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        {showAuth && !showSignup && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignup={() => setShowSignup(true)}
          />
        )}
        {showAuth && showSignup && (
          <Signup
            onSignupSuccess={handleLoginSuccess}
            onNavigateToLogin={() => setShowSignup(false)}
          />
        )}
        {showChat && !showProfile && (
          <ChatWindow
            chatId={currentChatId}
            onBack={currentChatId ? handleBackToChatList : null}
            onChatCreated={(chatId) => setCurrentChatId(chatId)}
            onProfilePress={() => setShowProfile(true)}
          />
        )}
        {showProfile && (
          <Profile
            onBack={() => setShowProfile(false)}
            onLogout={handleLogout}
          />
        )}
        <StatusBar style="light" />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
