import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onComplete }) => {
  const { colors, isDark } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.3));
  const [slideAnim] = useState(new Animated.Value(50));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [glowAnim] = useState(new Animated.Value(0.3));
  const [loadingProgress] = useState(new Animated.Value(0));
  
  // Animated background circles
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const circle3Anim = useRef(new Animated.Value(0)).current;
  const circle4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotating glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous rotation for hexagon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Floating background circles
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Anim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(circle1Anim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle2Anim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(circle2Anim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle3Anim, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(circle3Anim, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle4Anim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(circle4Anim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animated loading bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingProgress, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(loadingProgress, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Complete splash screen after animations finish (3.5 seconds)
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 7500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const circle1TranslateY = circle1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const circle2TranslateY = circle2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  const circle3TranslateX = circle3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const circle4TranslateY = circle4Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const loadingWidth = loadingProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '90%'],
  });

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <LinearGradient
        colors={isDark ? ['#0A0E27', '#1a1f3a', '#0F172A'] : ['#F8FAFC', '#FFFFFF', '#F1F5F9']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated background circles with floating effect */}
      <Animated.View
        style={[
          styles.circle1,
          {
            transform: [{ translateY: circle1TranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.25)', 'rgba(99, 102, 241, 0.05)']}
          style={styles.circleGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.circle2,
          {
            transform: [{ translateY: circle2TranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0.05)']}
          style={styles.circleGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.circle3,
          {
            transform: [{ translateX: circle3TranslateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
          style={styles.circleGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.circle4,
          {
            transform: [{ translateY: circle4TranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 0.05)']}
          style={styles.circleGradient}
        />
      </Animated.View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo/Icon with enhanced effects */}
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {/* Outer glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowAnim,
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          />
          
          {/* Hexagon with gradient */}
          <Animated.View
            style={[
              styles.hexagonWrapper,
              {
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2', '#F093FB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hexagon}
            >
              <View style={styles.hexagonInner}>
                <Text style={styles.hexText}>H</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Inner glow */}
          <Animated.View
            style={[
              styles.innerGlow,
              {
                opacity: glowAnim,
              },
            ]}
          />
        </Animated.View>

        {/* App name with enhanced styling */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={[styles.hexyText, { color: colors.text }]}>Hexy</Text>
          <View style={[styles.titleUnderline, { backgroundColor: colors.primary }]} />
        </Animated.View>

        {/* Tagline with slide animation */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.subText, { color: colors.textSecondary }]}>Your All-in-One AI Companion</Text>
          <View style={styles.dividerContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.divider}
            />
          </View>
          <Text style={[styles.featureText, { color: colors.textTertiary }]}>
            ✨ Smart • Intuitive • Powerful
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Enhanced loading indicator */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                width: loadingWidth,
              },
            ]}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2', '#F093FB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading...</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    top: -150,
    left: -150,
  },
  circle2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    bottom: -100,
    right: -100,
  },
  circle3: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: height * 0.5 - 150,
    right: -80,
  },
  circle4: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: height * 0.2,
    left: -80,
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.4)',
    borderStyle: 'dashed',
  },
  hexagonWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagon: {
    width: 140,
    height: 140,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hexagonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 30,
  },
  hexText: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: -2,
  },
  innerGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  hexyText: {
    fontSize: 56,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 4,
    textShadowColor: 'rgba(102, 126, 234, 0.8)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  titleUnderline: {
    width: 80,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 30,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  subText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  dividerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  divider: {
    width: 80,
    height: 4,
    borderRadius: 2,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  featureText: {
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 1.5,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    width: width * 0.75,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingProgress: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Poppins-Medium',
  },
});