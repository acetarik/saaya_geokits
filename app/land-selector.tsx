import { auth, firestore } from '@/config/firebase/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function LandSelectorScreen() {
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [landArea, setLandArea] = useState<number>(0);
  const [location, setLocation] = useState<{country: string; city: string} | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [landName, setLandName] = useState('');
  const [cropType, setCropType] = useState('');
  const [saving, setSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({ lat: 31.5204, lng: 74.3587 });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setMapCenter({
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const generateMapHTML = () => {
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoidXphaXJrYXNoaWYyNyIsImEiOiJjbWJyZG96bHowODZpMnFxdHRhNWo0Mmt2In0.celmSMfpC3VqWJWRSHFnoA';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Land Selector</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
      <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.js"></script>
      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css" type="text/css">
      <style>
        body { margin: 0; padding: 0; }
        html, body, #map { height: 100%; }
        .mapboxgl-canvas { outline: none; }
        .control-panel {
          position: absolute;
          top: 10px;
          left: 10px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
          max-width: 250px;
        }
        .control-panel h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #3F9142;
        }
        .control-panel p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        .instructions {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: rgba(63, 145, 66, 0.9);
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
        }
        .finish-btn {
          position: absolute;
          bottom: 80px;
          right: 20px;
          background: #3F9142;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: none;
        }
        .finish-btn:hover {
          background: #2E7D32;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="control-panel">
        <h3>Land Information</h3>
        <p id="area-display">Area: 0 acres</p>
        <p id="points-display">Points: 0</p>
        <p id="location-display">Location: Unknown</p>
      </div>
      <div class="instructions" id="instructions">
        Click on the map to start drawing your land boundary
      </div>
      <button class="finish-btn" id="finish-btn" onclick="finishDrawing()">
        Finish Drawing
      </button>

      <script>
        mapboxgl.accessToken = '${mapboxToken}';
        
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [${mapCenter.lng}, ${mapCenter.lat}],
          zoom: 15
        });

        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
          },
          defaultMode: 'draw_polygon'
        });

        map.addControl(draw);
        map.addControl(new mapboxgl.NavigationControl());

        let currentPolygon = null;
        let isDrawingMode = false;

        map.on('draw.create', updateArea);
        map.on('draw.delete', updateArea);
        map.on('draw.update', updateArea);

        function updateArea(e) {
          const data = draw.getAll();
          if (data.features.length > 0) {
            const polygon = data.features[0];
            const area = turf.area(polygon);
            const areaInAcres = area * 0.000247105;
            
            currentPolygon = polygon;
            
            document.getElementById('area-display').textContent = 
              areaInAcres < 1 ? 
              \`Area: \${Math.round(area)} sq m\` : 
              areaInAcres < 100 ?
              \`Area: \${areaInAcres.toFixed(2)} acres\` :
              \`Area: \${areaInAcres.toFixed(1)} acres\`;
            
            const coordinates = polygon.geometry.coordinates[0];
            document.getElementById('points-display').textContent = \`Points: \${coordinates.length - 1}\`;
            
            document.getElementById('finish-btn').style.display = 'block';
            document.getElementById('instructions').textContent = 'Great! Your land boundary is ready. Click Finish Drawing when done.';
            
            // Get location info for the first coordinate
            if (coordinates.length > 0) {
              getLocationInfo(coordinates[0][1], coordinates[0][0]);
            }
            
            // Send data to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'polygon_updated',
              area: areaInAcres,
              coordinates: coordinates.slice(0, -1), // Remove the last duplicate point
              polygon: polygon
            }));
          } else {
            document.getElementById('area-display').textContent = 'Area: 0 acres';
            document.getElementById('points-display').textContent = 'Points: 0';
            document.getElementById('location-display').textContent = 'Location: Unknown';
            document.getElementById('finish-btn').style.display = 'none';
            document.getElementById('instructions').textContent = 'Click on the map to start drawing your land boundary';
            
            currentPolygon = null;
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'polygon_cleared'
            }));
          }
        }

        async function getLocationInfo(lat, lng) {
          try {
            const response = await fetch(\`https://api.mapbox.com/geocoding/v5/mapbox.places/\${lng},\${lat}.json?access_token=\${mapboxgl.accessToken}\`);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              let country = 'Unknown';
              let city = 'Unknown';
              
              for (const feature of data.features) {
                if (feature.place_type.includes('country')) {
                  country = feature.text;
                }
                if (feature.place_type.includes('place') || feature.place_type.includes('locality')) {
                  city = feature.text;
                }
              }
              
              document.getElementById('location-display').textContent = \`Location: \${city}, \${country}\`;
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_updated',
                country: country,
                city: city
              }));
            }
          } catch (error) {
            console.error('Error getting location info:', error);
          }
        }

        function finishDrawing() {
          if (currentPolygon) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'finish_drawing',
              polygon: currentPolygon
            }));
          }
        }

        // Include Turf.js for area calculation
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@turf/turf@6/turf.min.js';
        document.head.appendChild(script);
      </script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'polygon_updated':
          setLandArea(data.area);
          setCoordinates(data.coordinates.map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          })));
          break;
          
        case 'polygon_cleared':
          setLandArea(0);
          setCoordinates([]);
          setLocation(null);
          break;
          
        case 'location_updated':
          setLocation({
            country: data.country,
            city: data.city,
          });
          break;
          
        case 'finish_drawing':
          if (coordinates.length >= 3) {
            setShowSaveModal(true);
          } else {
            Alert.alert('Incomplete Polygon', 'Please draw at least 3 points to create a valid land boundary.');
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const saveLand = async () => {
    if (!landName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your land.');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Authentication Error', 'Please log in to save your land.');
      return;
    }

    setSaving(true);
    try {
      const landData = {
        userId: auth.currentUser.uid,
        name: landName.trim(),
        coordinates: coordinates.map(coord => [coord.longitude, coord.latitude]),
        area: landArea,
        country: location?.country || 'Unknown',
        city: location?.city || 'Unknown',
        cropType: cropType.trim() || null,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(firestore, 'lands'), landData);
      
      Alert.alert('Success', 'Your land has been saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowSaveModal(false);
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving land:', error);
      Alert.alert('Error', 'Failed to save your land. Please try again.');
    } finally {
      setSaving(false);
    }
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B1B1B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Land</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.mapContainer}>
        <WebView
          source={{ html: generateMapHTML() }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3F9142" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        />
      </View>

      {/* Save Modal */}
      <Modal
        visible={showSaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Your Land</Text>
            
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Land Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={landName}
                  onChangeText={setLandName}
                  placeholder="e.g., North Field, Farm Plot 1"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Crop Type (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={cropType}
                  onChangeText={setCropType}
                  placeholder="e.g., Rice, Wheat, Cotton"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Land Summary</Text>
                <Text style={styles.summaryText}>Area: {formatArea(landArea)}</Text>
                <Text style={styles.summaryText}>
                  Location: {location?.city}, {location?.country}
                </Text>
                <Text style={styles.summaryText}>Points: {coordinates.length}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={saveLand}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Land</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  mapContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F5F2',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalForm: {
    maxHeight: 300,
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
    paddingVertical: 12,
    fontSize: 16,
    color: '#1B1B1B',
    backgroundColor: '#F9F9F9',
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6F6F6F',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6F6F6F',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3F9142',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});