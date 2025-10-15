import { auth, firestore } from '@/config/firebase/firebase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LandData {
  id: string;
  name: string;
  area: number;
  coordinates: { longitude: number; latitude: number }[];
  country: string;
  city: string;
  cropType?: string;
  createdAt: string;
}

export default function LandManagementScreen() {
  const [lands, setLands] = useState<LandData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserLands();
  }, []);

  const fetchUserLands = async () => {
    try {
      if (!auth.currentUser) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }
      
      console.log('Current user:', auth.currentUser.uid);
      console.log('User phone number:', auth.currentUser.phoneNumber);
      
      const landsQuery = query(
        collection(firestore, 'lands'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      console.log('Executing query for userId:', auth.currentUser.uid);
      const snapshot = await getDocs(landsQuery);
      console.log('Query executed successfully, docs count:', snapshot.docs.length);
      
      const landData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LandData[];
      
      setLands(landData);
    } catch (error) {
      console.error('Error fetching lands:', error);
      Alert.alert('Error', 'Failed to load your lands. Please check Firebase security rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLand = () => {
    router.push('/land-selector');
  };

  const handleDeleteLand = async (landId: string) => {
    Alert.alert(
      'Delete Land',
      'Are you sure you want to delete this land?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'lands', landId));
              setLands(lands.filter(land => land.id !== landId));
              Alert.alert('Success', 'Land deleted successfully');
            } catch (error) {
              console.error('Error deleting land:', error);
              Alert.alert('Error', 'Failed to delete land. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatArea = (area: number) => {
    if (area < 1) {
      return `${(area * 1000).toFixed(0)} sq m`;
    } else if (area < 100) {
      return `${area.toFixed(2)} acres`;
    } else {
      return `${area.toFixed(1)} acres`;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F9142" />
          <Text style={styles.loadingText}>Loading your lands...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B1B1B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Land Management</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.addLandCard}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddLand}>
            <Ionicons name="add-circle" size={32} color="#3F9142" />
            <Text style={styles.addButtonText}>Add New Land</Text>
            <Text style={styles.addButtonSubtext}>Draw your land boundaries on the map</Text>
          </TouchableOpacity>
        </View>

        {lands.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color="#C2C2C2" />
            <Text style={styles.emptyStateTitle}>No Lands Added Yet</Text>
            <Text style={styles.emptyStateText}>
              Start by adding your first land using the map selector above
            </Text>
          </View>
        ) : (
          <View style={styles.landsList}>
            <Text style={styles.sectionTitle}>Your Lands ({lands.length})</Text>
            {lands.map((land) => (
              <View key={land.id} style={styles.landCard}>
                <View style={styles.landInfo}>
                  <View style={styles.landHeader}>
                    <Text style={styles.landName}>{land.name}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteLand(land.id)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.landLocation}>
                    📍 {land.city}, {land.country}
                  </Text>
                  <Text style={styles.landArea}>
                    🗺️ {formatArea(land.area)}
                  </Text>
                  {land.cropType && (
                    <Text style={styles.cropType}>
                      🌾 {land.cropType}
                    </Text>
                  )}
                  <Text style={styles.createdDate}>
                    Added on {new Date(land.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Ionicons name="eye-outline" size={18} color="#3F9142" />
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  addLandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  addButton: {
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3F9142',
  },
  addButtonSubtext: {
    fontSize: 14,
    color: '#6F6F6F',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6F6F6F',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  landsList: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  landCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  landInfo: {
    flex: 1,
    gap: 4,
  },
  landHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  landName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  deleteButton: {
    padding: 4,
  },
  landLocation: {
    fontSize: 14,
    color: '#6F6F6F',
  },
  landArea: {
    fontSize: 14,
    color: '#6F6F6F',
  },
  cropType: {
    fontSize: 14,
    color: '#6F6F6F',
  },
  createdDate: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4F3E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F9142',
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