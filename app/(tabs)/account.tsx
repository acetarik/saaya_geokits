import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SETTINGS = [
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
];

export default function AccountScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Shams ud Din</Text>
            <Text style={styles.location}>📍 Hafiz Abad</Text>
          </View>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>My Location</Text>
          <Text style={styles.locationSubtitle}>Hafiz Abad</Text>
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
            <TouchableOpacity key={item.id} style={styles.settingItem}>
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
    padding: 20,
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
});
