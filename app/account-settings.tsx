import { auth, firestore, storage } from '@/config/firebase/firebase';
import { PAKISTAN_PROVINCES } from '@/utils/data/pakistani_provinces';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserData {
  name: string;
  email: string;
  province: string;
  district: string;
  profileImageUrl?: string;
}

export default function AccountSettingsScreen() {
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    province: '',
    district: '',
    profileImageUrl: '',
  });
  const [editedData, setEditedData] = useState<UserData>({
    name: '',
    email: '',
    province: '',
    district: '',
    profileImageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        setEditedData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const uploadImageToStorage = async (uri: string): Promise<string> => {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a unique filename with userId in the path
      const timestamp = Date.now();
      const storageRef = ref(storage, `profile-images/${auth.currentUser.uid}/${timestamp}.jpg`);

      // Upload the blob
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Slightly lower quality to reduce file size
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        
        try {
          // Upload to Firebase Storage and get permanent URL
          const imageUrl = await uploadImageToStorage(result.assets[0].uri);
          setEditedData({ ...editedData, profileImageUrl: imageUrl });
          
          Alert.alert('Success', 'Profile picture updated! Don\'t forget to save your changes.');
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setUploadingImage(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Slightly lower quality to reduce file size
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        
        try {
          // Upload to Firebase Storage and get permanent URL
          const imageUrl = await uploadImageToStorage(result.assets[0].uri);
          setEditedData({ ...editedData, profileImageUrl: imageUrl });
          
          Alert.alert('Success', 'Profile picture updated! Don\'t forget to save your changes.');
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setUploadingImage(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleProvinceSelect = (provinceId: string, provinceName: string) => {
    setEditedData({ 
      ...editedData, 
      province: provinceName,
      district: '' // Reset district when province changes
    });
    setShowProvinceModal(false);
  };

  const handleDistrictSelect = (districtName: string) => {
    setEditedData({ ...editedData, district: districtName });
    setShowDistrictModal(false);
  };

  const getSelectedProvinceDistricts = () => {
    const province = PAKISTAN_PROVINCES.find(p => p.name === editedData.province);
    return province?.districts || [];
  };

  const hasChanges = () => {
    return (
      editedData.name !== userData.name ||
      editedData.province !== userData.province ||
      editedData.district !== userData.district ||
      editedData.profileImageUrl !== userData.profileImageUrl
    );
  };

  const deleteOldProfileImage = async (imageUrl: string) => {
    try {
      // Only delete if it's a Firebase Storage URL and not the default image
      if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
        // Extract the path from the URL
        const urlParts = imageUrl.split('/o/')[1];
        if (urlParts) {
          const imagePath = decodeURIComponent(urlParts.split('?')[0]);
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
          console.log('Old profile image deleted successfully');
        }
      }
    } catch (error) {
      // Silently handle errors - old image deletion is not critical
      console.log('Could not delete old image:', error);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to update settings');
      return;
    }

    if (!editedData.name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty');
      return;
    }

    if (!editedData.province || !editedData.district) {
      Alert.alert('Validation Error', 'Please select both province and district');
      return;
    }

    setSaving(true);
    try {
      // If profile image changed, delete the old one
      if (editedData.profileImageUrl !== userData.profileImageUrl && userData.profileImageUrl) {
        await deleteOldProfileImage(userData.profileImageUrl);
      }

      const userRef = doc(firestore, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        name: editedData.name.trim(),
        province: editedData.province,
        district: editedData.district,
        profileImageUrl: editedData.profileImageUrl || userData.profileImageUrl,
        updatedAt: new Date().toISOString(),
      });

      setUserData(editedData);
      Alert.alert('Success', 'Your settings have been updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to account screen with update flag
            router.push({
              pathname: '/(tabs)/account',
              params: { settingsUpdated: 'true' }
            });
          }
        }
      ]);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          {
            text: 'Stay',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setEditedData(userData);
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F9142" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B1B1B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            <Image
              source={{
                uri: editedData.profileImageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={[styles.changePhotoButton, uploadingImage && styles.changePhotoButtonDisabled]}
              onPress={showImageOptions}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.changePhotoText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={editedData.name}
              onChangeText={(text) => setEditedData({ ...editedData, name: text })}
              placeholder="Enter your full name"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={editedData.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor="#A0A0A0"
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Province</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowProvinceModal(true)}
            >
              <Text style={editedData.province ? styles.selectText : styles.selectPlaceholder}>
                {editedData.province || 'Select your province'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>District</Text>
            <TouchableOpacity
              style={[styles.selectInput, !editedData.province && styles.disabledInput]}
              onPress={() => editedData.province && setShowDistrictModal(true)}
              disabled={!editedData.province}
            >
              <Text style={editedData.district ? styles.selectText : styles.selectPlaceholder}>
                {editedData.district || 'Select your district'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#A0A0A0" />
            </TouchableOpacity>
            {!editedData.province && (
              <Text style={styles.helperText}>Select province first</Text>
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges() || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges() || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Province Selection Modal */}
      <Modal
        visible={showProvinceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProvinceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Province</Text>
              <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
                <Ionicons name="close" size={24} color="#1B1B1B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {PAKISTAN_PROVINCES.map((province) => (
                <TouchableOpacity
                  key={province.id}
                  style={[
                    styles.modalItem,
                    editedData.province === province.name && styles.modalItemSelected,
                  ]}
                  onPress={() => handleProvinceSelect(province.id, province.name)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      editedData.province === province.name && styles.modalItemTextSelected,
                    ]}
                  >
                    {province.name}
                  </Text>
                  {editedData.province === province.name && (
                    <Ionicons name="checkmark" size={20} color="#3F9142" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <Ionicons name="close" size={24} color="#1B1B1B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {getSelectedProvinceDistricts().map((district) => (
                <TouchableOpacity
                  key={district.id}
                  style={[
                    styles.modalItem,
                    editedData.district === district.name && styles.modalItemSelected,
                  ]}
                  onPress={() => handleDistrictSelect(district.name)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      editedData.district === district.name && styles.modalItemTextSelected,
                    ]}
                  >
                    {district.name}
                  </Text>
                  {editedData.district === district.name && (
                    <Ionicons name="checkmark" size={20} color="#3F9142" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 16,
  },
  profilePictureContainer: {
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F9142',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  changePhotoButtonDisabled: {
    opacity: 0.7,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1B1B1B',
    backgroundColor: '#FFFFFF',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  selectText: {
    fontSize: 16,
    color: '#1B1B1B',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    color: '#6F6F6F',
    marginTop: 6,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F9142',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#3F9142',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  modalList: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalItemSelected: {
    backgroundColor: '#E4F3E6',
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  modalItemText: {
    fontSize: 16,
    color: '#1B1B1B',
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: '#3F9142',
  },
});
