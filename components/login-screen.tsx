import { auth } from '@/config/firebase/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onSwitchToSignup: () => void;
  onLogin: () => void;
}

export default function LoginScreen({ onSwitchToSignup, onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Logged in successfully!');
      onLogin();
    } catch (error: any) {
      let errorMessage = 'An error occurred during login';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Main content area - keeps space for input */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <View style={styles.emailIcon}>
                <Text style={styles.emailIconText}>�</Text>
              </View>
              <TextInput
                style={styles.emailInput}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordIcon}>
                <Text style={styles.passwordIconText}>🔒</Text>
              </View>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Button section */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.loginButton, (!email || !password) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!email || !password || isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupButton} onPress={onSwitchToSignup}>
              <Text style={styles.signupButtonText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  inputSection: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100, // Give some space above the buttons
    gap: 16, // Add gap between inputs
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  emailIcon: {
    marginRight: 12,
  },
  emailIconText: {
    fontSize: 18,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  passwordIcon: {
    marginRight: 12,
  },
  passwordIconText: {
    fontSize: 18,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  buttonSection: {
    paddingBottom: 50,
    gap: 16,
  },
  loginButton: {
    backgroundColor: '#2D6A5D',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#2D6A5D',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});