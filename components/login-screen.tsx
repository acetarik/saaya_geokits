import { auth } from '@/config/firebase/firebase';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import React, { useRef, useState } from 'react';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number with country code (e.g., +923001234567)');
      return;
    }

    setIsLoading(true);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current!
      );
      setVerificationId(verificationId);
      setIsCodeSent(true);
      Alert.alert('Success', 'Verification code sent to your phone');
    } catch (error: any) {
      let errorMessage = 'An error occurred while sending verification code';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
      Alert.alert('Success', 'Logged in successfully!');
      onLogin();
    } catch (error: any) {
      let errorMessage = 'An error occurred during login';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          {/* Main content area - keeps space for input */}
          <View style={styles.inputSection}>
            {!isCodeSent ? (
              <View style={styles.inputContainer}>
                <View style={styles.phoneIcon}>
                  <Text style={styles.phoneIconText}>📱</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Phone number (+923001234567)"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <View style={styles.codeIcon}>
                  <Text style={styles.codeIconText}>�</Text>
                </View>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Verification code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
              </View>
            )}
          </View>

          {/* Button section */}
          <View style={styles.buttonSection}>
            {!isCodeSent ? (
              <>
                <TouchableOpacity
                  style={[styles.loginButton, !phoneNumber && styles.loginButtonDisabled]}
                  onPress={sendVerificationCode}
                  disabled={!phoneNumber || isLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Sending...' : 'Send Verification Code'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.loginButton, !verificationCode && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={!verificationCode || isLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Verifying...' : 'Login'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => {
                    setIsCodeSent(false);
                    setVerificationCode('');
                    setVerificationId('');
                  }}
                >
                  <Text style={styles.resendButtonText}>Change Phone Number</Text>
                </TouchableOpacity>
              </>
            )}

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
  phoneIcon: {
    marginRight: 12,
  },
  phoneIconText: {
    fontSize: 18,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  codeIcon: {
    marginRight: 12,
  },
  codeIconText: {
    fontSize: 18,
  },
  codeInput: {
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
  resendButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2D6A5D',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  resendButtonText: {
    color: '#2D6A5D',
    fontSize: 16,
    fontWeight: '600',
  },
});