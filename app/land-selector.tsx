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
  const [webViewRef, setWebViewRef] = useState<any>(null);

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
      <script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow: hidden; }
        html, body, #map { height: 100%; width: 100%; }
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
          font-weight: 700;
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
          background: rgba(63, 145, 66, 0.95);
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .button-group {
          position: absolute;
          bottom: 80px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 1000;
        }
        
        .action-btn {
          background: #3F9142;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 140px;
        }
        
        .action-btn:active {
          transform: scale(0.95);
        }
        
        .action-btn.undo-btn {
          background: #FF9800;
        }
        
        .action-btn.clear-btn {
          background: #F44336;
        }
        
        .action-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .marker {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3F9142;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .marker:hover {
          transform: scale(1.2);
        }
        
        .marker.first {
          background: #FF5722;
          width: 20px;
          height: 20px;
          border-width: 4px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.7); }
          50% { box-shadow: 0 0 0 8px rgba(255, 87, 34, 0); }
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
        Tap on the map to mark corners of your land
      </div>
      
      <div class="button-group" id="button-group" style="display: none;">
        <button class="action-btn undo-btn" id="undo-btn" onclick="undoLastPoint()">
          ↶ Undo Last
        </button>
        <button class="action-btn clear-btn" id="clear-btn" onclick="clearAll()">
          ✕ Clear All
        </button>
        <button class="action-btn" id="finish-btn" onclick="finishDrawing()">
          ✓ Finish
        </button>
      </div>

      <script>
        mapboxgl.accessToken = '${mapboxToken}';
        
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [${mapCenter.lng}, ${mapCenter.lat}],
          zoom: 16
        });

        let points = [];
        let markers = [];
        let polygonLayer = null;
        let isDrawing = false;

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
          // Add sources for polygon and lines
          map.addSource('polygon', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[]]
              }
            }
          });

          map.addSource('lines', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }
          });

          // Add polygon fill layer
          map.addLayer({
            id: 'polygon-fill',
            type: 'fill',
            source: 'polygon',
            paint: {
              'fill-color': '#3F9142',
              'fill-opacity': 0.3
            }
          });

          // Add polygon outline layer
          map.addLayer({
            id: 'polygon-outline',
            type: 'line',
            source: 'polygon',
            paint: {
              'line-color': '#3F9142',
              'line-width': 3
            }
          });

          // Add line layer for active drawing
          map.addLayer({
            id: 'line-active',
            type: 'line',
            source: 'lines',
            paint: {
              'line-color': '#FF9800',
              'line-width': 2,
              'line-dasharray': [2, 2]
            }
          });
        });

        map.on('click', (e) => {
          addPoint(e.lngLat.lng, e.lngLat.lat);
        });

        function addPoint(lng, lat) {
          points.push([lng, lat]);
          
          // Create marker element
          const el = document.createElement('div');
          el.className = points.length === 1 ? 'marker first' : 'marker';
          
          // Add marker to map
          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map);
          
          markers.push(marker);
          
          // Get location info for first point
          if (points.length === 1) {
            getLocationInfo(lat, lng);
          }
          
          updateDrawing();
          updateUI();
        }

        function updateDrawing() {
          if (points.length < 1) return;

          // Update line string
          map.getSource('lines').setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: points
            }
          });

          // Update polygon if we have at least 3 points
          if (points.length >= 3) {
            const closedPoints = [...points, points[0]];
            map.getSource('polygon').setData({
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [closedPoints]
              }
            });
            
            calculateArea();
          }
        }

        function calculateArea() {
          if (points.length < 3) return;

          try {
            const closedPoints = [...points, points[0]];
            const polygon = turf.polygon([closedPoints]);
            const area = turf.area(polygon);
            const areaInAcres = area * 0.000247105;
            
            const areaText = area < 4047 ? 
              \`\${Math.round(area)} sq m\` : 
              areaInAcres < 100 ?
              \`\${areaInAcres.toFixed(2)} acres\` :
              \`\${areaInAcres.toFixed(1)} acres\`;
            
            document.getElementById('area-display').textContent = \`Area: \${areaText}\`;
            
            // Send data to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'polygon_updated',
              area: areaInAcres,
              coordinates: points
            }));
          } catch (error) {
            console.error('Error calculating area:', error);
          }
        }

        function updateUI() {
          const pointCount = points.length;
          document.getElementById('points-display').textContent = \`Points: \${pointCount}\`;
          
          if (pointCount === 0) {
            document.getElementById('instructions').textContent = 
              'Tap on the map to mark corners of your land';
            document.getElementById('button-group').style.display = 'none';
          } else if (pointCount === 1) {
            document.getElementById('instructions').textContent = 
              'Continue tapping to mark all corners';
            document.getElementById('button-group').style.display = 'flex';
            document.getElementById('finish-btn').disabled = true;
          } else if (pointCount === 2) {
            document.getElementById('instructions').textContent = 
              'Add at least one more point to complete the boundary';
            document.getElementById('finish-btn').disabled = true;
          } else {
            document.getElementById('instructions').textContent = 
              'Tap "Finish" when done or continue adding points';
            document.getElementById('finish-btn').disabled = false;
          }
        }

        function undoLastPoint() {
          if (points.length === 0) return;
          
          points.pop();
          const lastMarker = markers.pop();
          lastMarker.remove();
          
          if (points.length === 0) {
            clearAll();
          } else {
            updateDrawing();
            updateUI();
          }
        }

        function clearAll() {
          points = [];
          markers.forEach(marker => marker.remove());
          markers = [];
          
          map.getSource('lines').setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
          
          map.getSource('polygon').setData({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[]]
            }
          });
          
          document.getElementById('area-display').textContent = 'Area: 0 acres';
          document.getElementById('location-display').textContent = 'Location: Unknown';
          
          updateUI();
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'polygon_cleared'
          }));
        }

        async function getLocationInfo(lat, lng) {
          try {
            const response = await fetch(\`https://api.mapbox.com/geocoding/v5/mapbox.places/\${lng},\${lat}.json?types=country,region,place,locality,district&access_token=\${mapboxgl.accessToken}\`);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              let country = 'Unknown';
              let city = 'Unknown';
              
              // Try to find country and city/place from features
              for (const feature of data.features) {
                const types = feature.place_type;
                
                if (types.includes('country') && country === 'Unknown') {
                  country = feature.text;
                }
                
                if ((types.includes('place') || types.includes('locality') || types.includes('district')) && city === 'Unknown') {
                  city = feature.text;
                }
              }
              
              // If still unknown, use the first feature's text
              if (city === 'Unknown' && data.features[0]) {
                city = data.features[0].text || data.features[0].place_name?.split(',')[0] || 'Unknown';
              }
              
              if (country === 'Unknown' && data.features.length > 0) {
                // Country is usually the last context item
                const lastFeature = data.features[data.features.length - 1];
                if (lastFeature.place_type.includes('country')) {
                  country = lastFeature.text;
                }
              }
              
              const locationText = city !== 'Unknown' || country !== 'Unknown' 
                ? \`\${city}, \${country}\`
                : 'Location detected';
              
              document.getElementById('location-display').textContent = \`Location: \${locationText}\`;
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_updated',
                country: country,
                city: city
              }));
            } else {
              // No features returned, but we have coordinates
              document.getElementById('location-display').textContent = \`Location: \${lat.toFixed(4)}, \${lng.toFixed(4)}\`;
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_updated',
                country: 'Unknown',
                city: 'Unknown'
              }));
            }
          } catch (error) {
            console.error('Error getting location info:', error);
            document.getElementById('location-display').textContent = 'Location: Loading...';
          }
        }

        function finishDrawing() {
          if (points.length < 3) {
            alert('Please add at least 3 points to create a valid land boundary');
            return;
          }
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'finish_drawing',
            coordinates: points
          }));
        }

        // Listen for messages from React Native
        window.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          if (data.command === 'clear') {
            clearAll();
          }
        });
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
          if (data.coordinates && data.coordinates.length >= 3) {
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

    if (coordinates.length < 3) {
      Alert.alert('Invalid Polygon', 'Please draw at least 3 points to create a valid land boundary.');
      return;
    }

    setSaving(true);
    try {
      const coordinatesData = coordinates.map(coord => ({
        longitude: coord.longitude,
        latitude: coord.latitude
      }));

      const landData = {
        userId: auth.currentUser.uid,
        name: landName.trim(),
        coordinates: coordinatesData,
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
            setLandName('');
            setCropType('');
            setCoordinates([]);
            setLandArea(0);
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
      return `${(area * 4047).toFixed(0)} sq m`;
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
          ref={setWebViewRef}
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

      <Modal
        visible={showSaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Your Land</Text>
            
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
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
                <View style={styles.summaryRow}>
                  <Ionicons name="resize-outline" size={18} color="#3F9142" />
                  <Text style={styles.summaryText}>Area: {formatArea(landArea)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="location-outline" size={18} color="#3F9142" />
                  <Text style={styles.summaryText}>
                    {location?.city}, {location?.country}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="git-commit-outline" size={18} color="#3F9142" />
                  <Text style={styles.summaryText}>Points: {coordinates.length}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSaveModal(false)}
                disabled={saving}
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
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
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
    marginTop: 12,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1B1B1B',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalForm: {
    maxHeight: 350,
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
    backgroundColor: '#F9F9F9',
  },
  summaryCard: {
    backgroundColor: '#F0F8F1',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D4EDD6',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#4A4A4A',
    flex: 1,
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
    justifyContent: 'center',
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
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});