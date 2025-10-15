import { auth, firestore, storage } from '@/config/firebase/firebase'; // Make sure this path is correct
import { PAKISTAN_PROVINCES } from '@/utils/data/pakistani_provinces';
import { District, Province } from '@/utils/types';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import * as ImagePicker from 'expo-image-picker';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useRef, useState } from 'react';


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
    phoneNumber: '',
    province: '',
    district: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

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

  const uploadImage = (uri: string, userId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        const blob = xhr.response;
        const imageRef = ref(storage, `profile-images/${userId}/${Date.now()}.jpg`);
        
        uploadBytes(imageRef, blob as Blob)
          .then(snapshot => {
            getDownloadURL(snapshot.ref)
              .then(url => {
                resolve(url);
              })
              .catch(error => {
                console.error("Error getting download URL:", error);
                reject(error);
              });
          })
          .catch(error => {
            console.error("Error uploading image:", error);
            reject(error);
          });
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  const sendVerificationCode = async () => {
    // Validate form
    if (!formData.name || !formData.phoneNumber || !formData.province || !formData.district) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number with country code (e.g., +923001234567)');
      return;
    }

    setIsLoading(true);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        formData.phoneNumber,
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

  const handleSignup = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      // Verify phone number
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Upload profile image if selected
      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadImage(profileImage, user.uid);
      }

      // Save user data to Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        province: formData.province,
        district: formData.district,
        profileImageUrl: profileImageUrl,
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Account created successfully!');
      onSignup();
    } catch (error: any) {
      let errorMessage = 'An error occurred during signup';
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

  const isFormValid = !isCodeSent 
    ? formData.name && formData.phoneNumber && formData.province && formData.district
    : verificationCode;

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

              {/* Phone Number Input */}
              {!isCodeSent && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Phone number (+923001234567)"
                    value={formData.phoneNumber}
                    onChangeText={(value) => handleInputChange('phoneNumber', value)}
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {/* Verification Code Input */}
              {isCodeSent && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Verification code"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              )}

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
              {!isCodeSent ? (
                <TouchableOpacity
                  style={[
                    styles.generateOTPButton, 
                    !isFormValid && styles.generateOTPButtonDisabled
                  ]}
                  onPress={sendVerificationCode}
                  disabled={!isFormValid || isLoading}
                >
                  <Text style={styles.generateOTPButtonText}>
                    {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
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
  resendButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A9B8E',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  resendButtonText: {
    color: '#4A9B8E',
    fontSize: 16,
    fontWeight: '600',
  },
});
