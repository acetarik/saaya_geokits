import { auth, firestore, storage } from '@/config/firebase/firebase'; // Make sure this path is correct
import { PAKISTAN_PROVINCES } from '@/utils/data/pakistani_provinces';
import { District, Province } from '@/utils/types';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';


import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface SignupScreenProps {
  onSwitchToLogin: () => void;
  onSignup: () => void;
}


export default function SignupScreen({ onSwitchToLogin, onSignup }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    province: '',
    district: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // When province is selected, update available districts
  const handleProvinceSelect = (province: Province) => {
    setFormData(prev => ({ ...prev, province: province.name, district: '' })); // Clear district when province changes
    setAvailableDistricts(province.districts);
    setShowProvinceDropdown(false);
  };

  const handleDistrictSelect = (district: District) => {
    setFormData(prev => ({ ...prev, district: district.name }));
    setShowDistrictDropdown(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, userId: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const imageRef = ref(storage, `profile-images/${userId}/${Date.now()}.jpg`);
    await uploadBytes(imageRef, blob);
    
    return await getDownloadURL(imageRef);
  };

  const handleSignup = async () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.province || !formData.district) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Upload profile image if selected
      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadImage(profileImage, user.uid);
      }

      // Save user data to Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        province: formData.province,
        district: formData.district,
        profileImageUrl: profileImageUrl,
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Account created successfully!');
      onSignup();
    } catch (error: any) {
      let errorMessage = 'An error occurred during signup';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.password && formData.confirmPassword && formData.province && formData.district && formData.password === formData.confirmPassword;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowProvinceDropdown(false);
            setShowDistrictDropdown(false);
          }}
          style={styles.touchableWrapper}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header with Back Button */}
            <View style={styles.headerSection}>
              <TouchableOpacity style={styles.backButton} onPress={onSwitchToLogin}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerText}>Enter details for sign up</Text>
            </View>

            {/* Form inputs */}
            <View style={styles.formSection}>
              {/* Profile Image Selection */}
              <View style={styles.imageSection}>
                <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Text style={styles.placeholderText}>📷</Text>
                      <Text style={styles.placeholderSubText}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Name"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Email address"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>

              {/* Province Dropdown */}
              <View style={[styles.dropdownContainer, showProvinceDropdown && styles.provinceDropdownActive]}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowProvinceDropdown(!showProvinceDropdown);
                    setShowDistrictDropdown(false); // Close district dropdown
                  }}
                >
                  <Text style={[styles.dropdownText, !formData.province && styles.placeholderDropdownText]}>
                    {formData.province || 'Province'}
                  </Text>
                  <Text style={styles.dropdownArrow}>⌄</Text>
                </TouchableOpacity>

                {showProvinceDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {PAKISTAN_PROVINCES.map((province) => (
                        <TouchableOpacity
                          key={province.id}
                          style={styles.dropdownItem}
                          onPress={() => handleProvinceSelect(province)}
                        >
                          <Text style={styles.dropdownItemText}>{province.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* District Dropdown */}
              <View style={[styles.dropdownContainer, showDistrictDropdown && styles.districtDropdownActive]}>
                <TouchableOpacity
                  style={[styles.dropdownButton, !formData.province && styles.dropdownButtonDisabled]}
                  onPress={() => {
                    if (formData.province) {
                      setShowDistrictDropdown(!showDistrictDropdown);
                      setShowProvinceDropdown(false); // Close province dropdown
                    }
                  }}
                  disabled={!formData.province}
                >
                  <Text style={[styles.dropdownText, !formData.district && styles.placeholderDropdownText]}>
                    {formData.district || (formData.province ? 'District' : 'Select province first')}
                  </Text>
                  <Text style={styles.dropdownArrow}>⌄</Text>
                </TouchableOpacity>

                {showDistrictDropdown && formData.province && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      {availableDistricts.map((district) => (
                        <TouchableOpacity
                          key={district.id}
                          style={styles.dropdownItem}
                          onPress={() => handleDistrictSelect(district)}
                        >
                          <Text style={styles.dropdownItemText}>{district.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* ReCAPTCHA Modal */}
              {/* Removed for email/password authentication */}
            </View>

            {/* Button */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[
                  styles.generateOTPButton, 
                  !isFormValid && styles.generateOTPButtonDisabled
                ]}
                onPress={handleSignup}
                disabled={!isFormValid || isLoading}
              >
                <Text style={styles.generateOTPButtonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        </TouchableOpacity>
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
  touchableWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  headerSection: {
    marginBottom: 40,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A9B8E',
    fontWeight: '500',
  },
  headerText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24,
    marginBottom: 4,
  },
  placeholderSubText: {
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  textInput: {
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  provinceDropdownActive: {
    zIndex: 2000,
  },
  districtDropdownActive: {
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D0D0D0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderDropdownText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    marginTop: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  buttonSection: {
    paddingBottom: 50,
  },
  generateOTPButton: {
    backgroundColor: '#4A9B8E',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateOTPButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  generateOTPButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
