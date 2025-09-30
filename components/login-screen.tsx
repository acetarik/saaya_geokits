import React, { useState } from 'react';
import {
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

  const handleLogin = () => {
    // Here you would typically validate the phone number and make API call
    onLogin();
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
              <View style={styles.phoneIcon}>
                <Text style={styles.phoneIconText}>📞</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Button section */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.loginButton, !phoneNumber && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!phoneNumber}
            >
              <Text style={styles.loginButtonText}>Login</Text>
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