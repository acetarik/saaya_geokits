import React, { useState } from 'react';
import CustomSplashScreen from './splash-screen';
import LoginScreen from './login-screen';
import SignupScreen from './signup-screen';

type AuthFlowState = 'splash' | 'login' | 'signup';

interface AuthFlowProps {
  onAuthComplete: () => void;
}

export default function AuthFlow({ onAuthComplete }: AuthFlowProps) {
  const [currentScreen, setCurrentScreen] = useState<AuthFlowState>('splash');

  const handleLanguageSelected = () => {
    setCurrentScreen('login');
  };

  const handleSwitchToSignup = () => {
    setCurrentScreen('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentScreen('login');
  };

  const handleLogin = () => {
    // In a real app, you would validate credentials here
    onAuthComplete();
  };

  const handleSignup = () => {
    // In a real app, you would handle OTP verification here
    onAuthComplete();
  };

  switch (currentScreen) {
    case 'splash':
      return <CustomSplashScreen onFinish={handleLanguageSelected} />;
    case 'login':
      return (
        <LoginScreen
          onSwitchToSignup={handleSwitchToSignup}
          onLogin={handleLogin}
        />
      );
    case 'signup':
      return (
        <SignupScreen
          onSwitchToLogin={handleSwitchToLogin}
          onSignup={handleSignup}
        />
      );
    default:
      return <CustomSplashScreen onFinish={handleLanguageSelected} />;
  }
}