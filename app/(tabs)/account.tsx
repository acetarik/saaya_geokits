import { auth, firestore } from '@/config/firebase/firebase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SETTINGS = [
  {
    id: 'land-management',
    title: 'Land Management',
    icon: 'map-outline',
  },
  {
    id: 'settings',
    title: 'Account Settings',
    icon: 'settings-outline',
  },
  {
    id: 'support',
    title: 'Help & Support',
    icon: 'help-circle-outline',
  },
  {
    id: 'about',
    title: 'About Saaya',
    icon: 'information-circle-outline',
  },
  {
    id: 'logout',
    title: 'Logout',
    icon: 'log-out-outline',
  },
];

interface UserData {
  name: string;
  email: string;
  province: string;
  district: string;
  profileImageUrl?: string;
  createdAt: string;
}

export default function AccountScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The _layout.tsx will automatically detect auth state change and show AuthFlow
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleSettingPress = (id: string) => {
    if (id === 'logout') {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            onPress: handleLogout,
            style: 'destructive',
          },
        ]
      );
    } else if (id === 'land-management') {
      router.push('/land-management');
    }
    // Handle other settings here
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F9142" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image 
            source={{ 
              uri: userData?.profileImageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' 
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{userData?.name || 'Guest User'}</Text>
            <Text style={styles.location}>📍 {userData?.district || 'Location not set'}</Text>
          </View>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>My Location</Text>
          <Text style={styles.locationSubtitle}>{userData?.district || 'Location not set'}</Text>
          <View style={styles.weatherContainer}>
            <Text style={styles.temperature}>21°</Text>
            <View>
              <Text style={styles.weatherStatus}>Partly Cloudy</Text>
              <Text style={styles.weatherDetails}>H:28° L:19°</Text>
            </View>
          </View>
        </View>

        <View style={styles.fieldsSection}>
          <Text style={styles.sectionTitle}>My fields</Text>
          <View style={styles.fieldsGrid}>
            <View style={styles.fieldCard}>
              <Text style={styles.fieldName}>Bhimber</Text>
              <Text style={styles.fieldDetails}>10 Acres - Rice</Text>
            </View>
            <View style={styles.fieldCard}>
              <Text style={styles.fieldName}>Bhimber</Text>
              <Text style={styles.fieldDetails}>10 Acres - Rice</Text>
            </View>
            <View style={styles.fieldCard}>
              <Text style={styles.fieldName}>Bh</Text>
              <Text style={styles.fieldDetails}>10 Ac</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsList}>
          {SETTINGS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.settingItem} onPress={() => handleSettingPress(item.id)}>
              <View style={styles.settingIconWrapper}>
                <Ionicons name={item.icon as any} size={20} color="#3F9142" />
              </View>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C2C2C2" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 20,
    gap: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  location: {
    color: '#6F6F6F',
    marginTop: 4,
  },
  locationCard: {
    backgroundColor: '#3F9142',
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherStatus: {
    fontSize: 14,
    color: '#E8F5E9',
    textAlign: 'right',
  },
  weatherDetails: {
    fontSize: 12,
    color: '#E8F5E9',
    textAlign: 'right',
    marginTop: 2,
  },
  fieldsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldCard: {
    backgroundColor: '#4A4A4A',
    borderRadius: 16,
    padding: 16,
    width: '30%',
    minHeight: 80,
    justifyContent: 'center',
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fieldDetails: {
    fontSize: 12,
    color: '#E0E0E0',
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  settingIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E4F3E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#202020',
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
});
