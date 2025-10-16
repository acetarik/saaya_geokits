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

export default function GPSLandSelectorScreen() {
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [landArea, setLandArea] = useState<number>(0);
  const [location, setLocation] = useState<{country: string; city: string} | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [landName, setLandName] = useState('');
  const [cropType, setCropType] = useState('');
  const [saving, setSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({ lat: 31.5204, lng: 74.3587 });
  const [webViewRef, setWebViewRef] = useState<any>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

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

  const markCurrentLocation = async () => {
    if (gettingLocation) return;
    
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to mark your current position.');
        setGettingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const accuracy = currentLocation.coords.accuracy || 0;
      
      if (accuracy > 20) {
        Alert.alert(
          'Low GPS Accuracy',
          `Current GPS accuracy is ${accuracy.toFixed(0)} meters. For better results, ensure you have a clear view of the sky. Continue anyway?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setGettingLocation(false),
            },
            {
              text: 'Mark Anyway',
              onPress: () => addGPSPoint(currentLocation, accuracy),
            },
          ]
        );
        return;
      }

      addGPSPoint(currentLocation, accuracy);

    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Failed to get your current location. Please ensure GPS is enabled and try again.');
      setGettingLocation(false);
    }
  };

  const addGPSPoint = (currentLocation: any, accuracy: number) => {
    const newPoint = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };

    if (webViewRef) {
      webViewRef.postMessage(JSON.stringify({
        command: 'add_gps_point',
        point: {
          lng: newPoint.longitude,
          lat: newPoint.latitude,
        },
        accuracy: accuracy,
      }));
    }

    setCoordinates(prev => [...prev, newPoint]);
    
    const pointNumber = coordinates.length + 1;
    Alert.alert(
      '✓ Point Marked',
      `GPS Point ${pointNumber} added with ${accuracy.toFixed(1)}m accuracy.\n\n${pointNumber < 3 ? `Add ${3 - pointNumber} more point${3 - pointNumber > 1 ? 's' : ''} to complete the boundary.` : 'You can now finish or add more points.'}`,
      [{ text: 'OK' }]
    );
    
    setGettingLocation(false);
  };

  const generateMapHTML = () => {
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoidXphaXJrYXNoaWYyNyIsImEiOiJjbWJyZG96bHowODZpMnFxdHRhNWo0Mmt2In0.celmSMfpC3VqWJWRSHFnoA';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>GPS Land Selector</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
      <script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; padding: 0; overflow: hidden; }
        html, body, #map { height: 100%; width: 100%; }
        .mapboxgl-canvas { outline: none; }
        
        .info-panel {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 12px 14px;
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          min-width: 140px;
        }
        
        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 13px;
        }
        
        .info-row:last-child {
          margin-bottom: 0;
        }
        
        .info-icon {
          font-size: 16px;
        }
        
        .info-label {
          color: #666;
          font-weight: 500;
        }
        
        .info-value {
          color: #1B1B1B;
          font-weight: 700;
        }
        
        .accuracy-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }
        
        .accuracy-good { background: #D4EDD6; color: #2E7D32; }
        .accuracy-medium { background: #FFE0B2; color: #E65100; }
        .accuracy-poor { background: #FFCDD2; color: #C62828; }
        
        .action-buttons {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 8px;
          z-index: 1000;
        }
        
        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s;
        }
        
        .icon-btn:active {
          transform: scale(0.95);
        }
        
        .icon-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .icon-btn.undo { color: #FF9800; }
        .icon-btn.clear { color: #F44336; }
        .icon-btn.finish { 
          background: #3F9142;
          color: white;
          width: auto;
          padding: 0 16px;
          gap: 6px;
        }
        
        .finish-text {
          font-weight: 600;
          font-size: 14px;
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
          position: relative;
        }
        
        .marker.first {
          background: #FF5722;
          width: 20px;
          height: 20px;
          border-width: 4px;
          animation: pulse 2s infinite;
        }
        
        .marker::after {
          content: attr(data-index);
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.7); }
          50% { box-shadow: 0 0 0 8px rgba(255, 87, 34, 0); }
        }
        
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right {
          display: none;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <div class="info-panel">
        <div class="info-row">
          <span class="info-icon"></span>
          <span class="info-value" id="points-display">0 pts</span>
        </div>
        <div class="info-row">
          <span class="info-icon"></span>
          <span class="info-value" id="area-display">0 acres</span>
        </div>
        <div class="info-row" id="accuracy-row" style="display: none;">
          <span class="info-icon">🎯</span>
          <span id="accuracy-display" class="accuracy-badge">-</span>
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="icon-btn undo" id="undo-btn" onclick="undoLastPoint()" style="display: none;" title="Undo">
          ↶
        </button>
        <button class="icon-btn clear" id="clear-btn" onclick="clearAll()" style="display: none;" title="Clear">
          ✕
        </button>
        <button class="icon-btn finish" id="finish-btn" onclick="finishDrawing()" style="display: none;">
          <span>✓</span>
          <span class="finish-text">Finish</span>
        </button>
      </div>

      <script>
        mapboxgl.accessToken = '${mapboxToken}';
        
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [${mapCenter.lng}, ${mapCenter.lat}],
          zoom: 18
        });

        let points = [];
        let markers = [];

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
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

          map.addLayer({
            id: 'polygon-fill',
            type: 'fill',
            source: 'polygon',
            paint: {
              'fill-color': '#3F9142',
              'fill-opacity': 0.3
            }
          });

          map.addLayer({
            id: 'polygon-outline',
            type: 'line',
            source: 'polygon',
            paint: {
              'line-color': '#3F9142',
              'line-width': 3
            }
          });
        });

        function addGPSPoint(lng, lat, accuracy) {
          points.push([lng, lat]);
          
          const el = document.createElement('div');
          el.className = points.length === 1 ? 'marker first' : 'marker';
          el.setAttribute('data-index', points.length.toString());
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map);
          
          markers.push(marker);
          
          map.flyTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 18),
            duration: 1000
          });
          
          if (points.length === 1) {
            getLocationInfo(lat, lng);
          }
          
          if (accuracy !== undefined) {
            const accuracyRow = document.getElementById('accuracy-row');
            const accuracyDisplay = document.getElementById('accuracy-display');
            accuracyRow.style.display = 'flex';
            
            let accuracyClass = 'accuracy-good';
            let accuracyText = accuracy.toFixed(1) + 'm';
            
            if (accuracy >= 20) {
              accuracyClass = 'accuracy-poor';
            } else if (accuracy >= 10) {
              accuracyClass = 'accuracy-medium';
            }
            
            accuracyDisplay.className = 'accuracy-badge ' + accuracyClass;
            accuracyDisplay.textContent = accuracyText;
          }
          
          updatePolygon();
          updateUI();
        }

        function updatePolygon() {
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
          } else {
            map.getSource('polygon').setData({
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[]]
              }
            });
            document.getElementById('area-display').textContent = '0 acres';
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
              \`\${Math.round(area)} m²\` : 
              areaInAcres < 100 ?
              \`\${areaInAcres.toFixed(2)} ac\` :
              \`\${areaInAcres.toFixed(1)} ac\`;
            
            document.getElementById('area-display').textContent = areaText;
            
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
          document.getElementById('points-display').textContent = pointCount + ' pt' + (pointCount !== 1 ? 's' : '');
          
          const undoBtn = document.getElementById('undo-btn');
          const clearBtn = document.getElementById('clear-btn');
          const finishBtn = document.getElementById('finish-btn');
          
          if (pointCount === 0) {
            undoBtn.style.display = 'none';
            clearBtn.style.display = 'none';
            finishBtn.style.display = 'none';
          } else if (pointCount < 3) {
            undoBtn.style.display = 'flex';
            clearBtn.style.display = 'flex';
            finishBtn.style.display = 'none';
          } else {
            undoBtn.style.display = 'flex';
            clearBtn.style.display = 'flex';
            finishBtn.style.display = 'flex';
            finishBtn.disabled = false;
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
            updatePolygon();
            updateUI();
          }
        }

        function clearAll() {
          points = [];
          markers.forEach(marker => marker.remove());
          markers = [];
          
          map.getSource('polygon').setData({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[]]
            }
          });
          
          document.getElementById('area-display').textContent = '0 acres';
          document.getElementById('accuracy-row').style.display = 'none';
          
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
              
              for (const feature of data.features) {
                const types = feature.place_type;
                
                if (types.includes('country') && country === 'Unknown') {
                  country = feature.text;
                }
                
                if ((types.includes('place') || types.includes('locality') || types.includes('district')) && city === 'Unknown') {
                  city = feature.text;
                }
              }
              
              if (city === 'Unknown' && data.features[0]) {
                city = data.features[0].text || data.features[0].place_name?.split(',')[0] || 'Unknown';
              }
              
              if (country === 'Unknown' && data.features.length > 0) {
                const lastFeature = data.features[data.features.length - 1];
                if (lastFeature.place_type.includes('country')) {
                  country = lastFeature.text;
                }
              }
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_updated',
                country: country,
                city: city
              }));
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_updated',
                country: 'Unknown',
                city: 'Unknown'
              }));
            }
          } catch (error) {
            console.error('Error getting location info:', error);
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

        window.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          if (data.command === 'clear') {
            clearAll();
          } else if (data.command === 'add_gps_point') {
            addGPSPoint(data.point.lng, data.point.lat, data.accuracy);
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
            Alert.alert('Incomplete Polygon', 'Please add at least 3 points to create a valid land boundary.');
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
      Alert.alert('Invalid Polygon', 'Please add at least 3 points to create a valid land boundary.');
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
        mappingMethod: 'GPS',
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
        <Text style={styles.headerTitle}>GPS Land Mapping</Text>
        <TouchableOpacity 
          onPress={() => setShowHelpModal(true)} 
          style={styles.helpButton}
        >
          <Ionicons name="help-circle-outline" size={24} color="#3F9142" />
        </TouchableOpacity>
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
        
        <View style={styles.gpsButtonContainer}>
          <TouchableOpacity 
            style={[styles.gpsButton, gettingLocation && styles.gpsButtonDisabled]}
            onPress={markCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="locate" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.gpsButtonText}>
              {gettingLocation ? 'Getting GPS...' : 'Mark Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <TouchableOpacity 
          style={styles.helpModalOverlay}
          activeOpacity={1}
          onPress={() => setShowHelpModal(false)}
        >
          <View style={styles.helpModalContent}>
            <View style={styles.helpHeader}>
              <Ionicons name="information-circle" size={28} color="#3F9142" />
              <Text style={styles.helpTitle}>How to Map Your Land</Text>
            </View>
            
            <View style={styles.helpSteps}>
              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Walk to First Corner</Text>
                  <Text style={styles.stepDescription}>
                    Stand at any corner of your land boundary
                  </Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Tap "Mark Location"</Text>
                  <Text style={styles.stepDescription}>
                    Wait for GPS accuracy, then tap the green button
                  </Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Continue Walking</Text>
                  <Text style={styles.stepDescription}>
                    Walk to each corner and mark (minimum 3 points)
                  </Text>
                </View>
              </View>

              <View style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Finish & Save</Text>
                  <Text style={styles.stepDescription}>
                    Tap "Finish" when complete, then save your land
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.helpTips}>
              <Text style={styles.helpTipsTitle}>💡 Tips for Best Results</Text>
              <Text style={styles.helpTip}>• Ensure clear view of sky for better GPS accuracy</Text>
              <Text style={styles.helpTip}>• Walk along the actual boundary of your land</Text>
              <Text style={styles.helpTip}>• Mark all major corners and turns</Text>
              <Text style={styles.helpTip}>• Aim for GPS accuracy under 10 meters</Text>
            </View>

            <TouchableOpacity 
              style={styles.helpCloseButton}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.helpCloseButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Save Modal */}
      <Modal
        visible={showSaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Your GPS-Mapped Land</Text>
            
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
                <Text style={styles.summaryTitle}>GPS Land Summary</Text>
                <View style={styles.summaryRow}>
                  <Ionicons name="navigate-circle" size={18} color="#3F9142" />
                  <Text style={styles.summaryText}>Mapping: GPS-based</Text>
                </View>
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
                  <Text style={styles.summaryText}>GPS Points: {coordinates.length}</Text>
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
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
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
  gpsButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  gpsButton: {
    backgroundColor: '#3F9142',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gpsButtonDisabled: {
    opacity: 0.7,
  },
  gpsButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
    flex: 1,
  },
  helpSteps: {
    marginBottom: 20,
  },
  helpStep: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3F9142',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  helpTips: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE8A3',
    marginBottom: 20,
  },
  helpTipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 10,
  },
  helpTip: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  helpCloseButton: {
    backgroundColor: '#3F9142',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  helpCloseButtonText: {
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