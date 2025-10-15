import { auth, firestore } from '@/config/firebase/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
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

type SelectionMode = 'draw' | 'track';

export default function LandSelectorScreen() {
  const params = useLocalSearchParams();
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [landArea, setLandArea] = useState<number>(0);
  const [location, setLocation] = useState<{country: string; city: string} | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [landName, setLandName] = useState('');
  const [cropType, setCropType] = useState('');
  const [saving, setSaving] = useState(false);
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number}>({ lat: 31.5204, lng: 74.3587 });
  
  // Location tracking mode states
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('draw');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingPoints, setTrackingPoints] = useState<Coordinates[]>([]);
  
  // View mode - when viewing existing land
  const isViewMode = params.viewMode === 'true';
  const landId = params.landId as string;
  const [showModeSelector, setShowModeSelector] = useState(!isViewMode); // Show by default for new users

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    // Load land data if in view mode
    if (isViewMode && params.coordinates) {
      try {
        const landCoordinates = JSON.parse(params.coordinates as string) as Coordinates[];
        setCoordinates(landCoordinates);
        setLandName(params.landName as string || '');
        setLandArea(parseFloat(params.landArea as string) || 0);
        setCropType(params.cropType as string || '');
        setLocation({
          country: params.country as string || '',
          city: params.city as string || ''
        });

        // Set map center to first coordinate if available
        if (landCoordinates.length > 0) {
          setMapCenter({
            lat: landCoordinates[0].latitude,
            lng: landCoordinates[0].longitude
          });
        }
      } catch (error) {
        console.error('Error loading land data:', error);
        Alert.alert('Error', 'Failed to load land data');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViewMode, params.coordinates, params.landName, params.landArea, params.cropType, params.country, params.city]);

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

  const formatArea = (area: number) => {
    if (area < 1) {
      return `${(area * 1000).toFixed(0)} sq m`;
    } else if (area < 100) {
      return `${area.toFixed(2)} acres`;
    } else {
      return `${area.toFixed(1)} acres`;
    }
  };

  // Location tracking functions
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required for GPS tracking.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const newPoint: Coordinates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setTrackingPoints([newPoint]);
      setIsTracking(true);
      setMapCenter({
        lat: newPoint.latitude,
        lng: newPoint.longitude,
      });

      // Get location info for the first point
      getLocationFromCoordinates(newPoint.latitude, newPoint.longitude);

      Alert.alert(
        'GPS Tracking Started',
        'First point added! Move to your next land boundary point and tap "Add Point" to continue.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    }
  };

  const addTrackingPoint = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const newPoint: Coordinates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      const updatedPoints = [...trackingPoints, newPoint];
      setTrackingPoints(updatedPoints);

      // Calculate area if we have at least 3 points
      if (updatedPoints.length >= 3) {
        calculateTrackingArea(updatedPoints);
      }

      Alert.alert(
        'Point Added',
        `Point ${updatedPoints.length} added successfully. ${updatedPoints.length >= 3 ? 'You can now finish mapping or add more points.' : 'Continue to the next boundary point.'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding tracking point:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    }
  };

  const calculateTrackingArea = (points: Coordinates[]) => {
    if (points.length < 3) return;

    // Convert to format suitable for area calculation
    const coords = points.map(p => [p.longitude, p.latitude]);
    coords.push(coords[0]); // Close the polygon

    // Simple polygon area calculation using shoelace formula
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
    }
    area = Math.abs(area) / 2;

    // Convert from decimal degrees to square meters (approximate)
    const areaInSqMeters = area * 111320 * 111320 * Math.cos(points[0].latitude * Math.PI / 180);
    const areaInAcres = areaInSqMeters * 0.000247105;

    setLandArea(areaInAcres);
    setCoordinates(points);

    // Get location info for the first point if we don't have it yet
    if (!location && points.length > 0) {
      getLocationFromCoordinates(points[0].latitude, points[0].longitude);
    }
  };

  const getLocationFromCoordinates = async (lat: number, lng: number) => {
    try {
      const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoidXphaXJrYXNoaWYyNyIsImEiOiJjbWJyZG96bHowODZpMnFxdHRhNWo0Mmt2In0.celmSMfpC3VqWJWRSHFnoA';
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`);
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
        
        setLocation({ country, city });
      }
    } catch (error) {
      console.error('Error getting location info:', error);
    }
  };

  const finishTracking = () => {
    if (trackingPoints.length < 3) {
      Alert.alert('Insufficient Points', 'Please add at least 3 points to create a valid land boundary.');
      return;
    }

    setIsTracking(false);
    setShowSaveModal(true);
  };

  const cancelTracking = () => {
    Alert.alert(
      'Cancel GPS Tracking',
      'Are you sure you want to cancel? All tracked points will be lost.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setIsTracking(false);
            setTrackingPoints([]);
            setCoordinates([]);
            setLandArea(0);
            setLocation(null);
          },
        },
      ]
    );
  };

  const generateMapHTML = () => {
    const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoidXphaXJrYXNoaWYyNyIsImEiOiJjbWJyZG96bHowODZpMnFxdHRhNWo0Mmt2In0.celmSMfpC3VqWJWRSHFnoA';
    
    // Prepare land data for view mode or tracking mode
    const landPolygonCoords = isViewMode && coordinates.length > 0 
      ? coordinates.map(coord => [coord.longitude, coord.latitude])
      : selectionMode === 'track' && trackingPoints.length > 0
      ? trackingPoints.map(coord => [coord.longitude, coord.latitude])
      : [];
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${isViewMode ? 'Land Details' : 'Land Selector'}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
      ${!isViewMode && selectionMode === 'draw' ? `
      <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.js"></script>
      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css" type="text/css">
      ` : ''}
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
          ${isViewMode ? 'display: none;' : ''}
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
          ${isViewMode ? 'display: none;' : 'display: none;'}
        }
        .finish-btn:hover {
          background: #2E7D32;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="control-panel">
        <h3>${isViewMode ? landName || 'Land Details' : selectionMode === 'track' ? 'GPS Tracking' : 'Land Information'}</h3>
        <p id="area-display">Area: ${isViewMode ? formatArea(landArea) : landArea > 0 ? formatArea(landArea) : '0 acres'}</p>
        <p id="points-display">Points: ${isViewMode ? coordinates.length : selectionMode === 'track' ? trackingPoints.length : '0'}</p>
        <p id="location-display">Location: ${isViewMode && location ? `${location.city}, ${location.country}` : 'Unknown'}</p>
        ${isViewMode && cropType ? `<p><strong>Crop:</strong> ${cropType}</p>` : ''}
        ${selectionMode === 'track' && !isViewMode ? `<p><strong>Mode:</strong> GPS Tracking</p>` : ''}
      </div>
      ${!isViewMode ? `
      <div class="instructions" id="instructions">
        ${selectionMode === 'draw' ? 'Click on the map to start drawing your land boundary' : 'Use the GPS tracking controls to map your land'}
      </div>
      <button class="finish-btn" id="finish-btn" onclick="finishDrawing()">
        Finish Drawing
      </button>
      ` : ''}

      <script>
        mapboxgl.accessToken = '${mapboxToken}';
        
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [${mapCenter.lng}, ${mapCenter.lat}],
          zoom: 15
        });

        ${!isViewMode && selectionMode === 'draw' ? `
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
          },
          defaultMode: 'draw_polygon'
        });

        map.addControl(draw);
        ` : ''}

        map.on('load', () => {
          ${(isViewMode && landPolygonCoords.length > 0) || (selectionMode === 'track' && landPolygonCoords.length > 0) ? `
          // Add markers for tracking points
          ${JSON.stringify(landPolygonCoords)}.forEach((coord, index) => {
            const marker = new mapboxgl.Marker({
              color: '#3F9142'
            })
            .setLngLat(coord)
            .setPopup(new mapboxgl.Popup().setHTML(\`<div>Point \${index + 1}</div>\`))
            .addTo(map);
          });

          // Add polygon if we have enough points
          if (${JSON.stringify(landPolygonCoords)}.length >= 3) {
            map.addSource('land-polygon', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'geometry': {
                  'type': 'Polygon',
                  'coordinates': [${JSON.stringify([...landPolygonCoords, landPolygonCoords[0]])}]
                }
              }
            });

            map.addLayer({
              'id': 'land-polygon-fill',
              'type': 'fill',
              'source': 'land-polygon',
              'paint': {
                'fill-color': '#3F9142',
                'fill-opacity': 0.3
              }
            });

            map.addLayer({
              'id': 'land-polygon-outline',
              'type': 'line',
              'source': 'land-polygon',
              'paint': {
                'line-color': '#3F9142',
                'line-width': 3
              }
            });
          }

          // Add connecting lines between points
          if (${JSON.stringify(landPolygonCoords)}.length >= 2) {
            map.addSource('tracking-lines', {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'geometry': {
                  'type': 'LineString',
                  'coordinates': ${JSON.stringify(landPolygonCoords)}
                }
              }
            });

            map.addLayer({
              'id': 'tracking-lines',
              'type': 'line',
              'source': 'tracking-lines',
              'paint': {
                'line-color': '#3F9142',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }
            });
          }

          // Fit map to points bounds
          if (${JSON.stringify(landPolygonCoords)}.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            ${JSON.stringify(landPolygonCoords)}.forEach(coord => bounds.extend(coord));
            map.fitBounds(bounds, { padding: 50 });
          }
          ` : ''}
        });

        map.addControl(new mapboxgl.NavigationControl());

        ${!isViewMode && selectionMode === 'draw' ? `
        let currentPolygon = null;

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
              coordinates: coordinates.slice(0, -1),
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
        ` : ''}

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
          if (coordinates.length >= 3 || trackingPoints.length >= 3) {
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

    // Use the appropriate coordinates based on selection mode
    const activeCoordinates = selectionMode === 'track' ? trackingPoints : coordinates;
    
    if (activeCoordinates.length < 3) {
      Alert.alert('Insufficient Points', 'Please add at least 3 points to create a valid land boundary.');
      return;
    }

    setSaving(true);
    try {
      const coordinatesData = activeCoordinates.map(coord => ({
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
        selectionMethod: selectionMode, // Track which method was used
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B1B1B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isViewMode ? 'View Land Details' : 'Select Your Land'}
        </Text>
        {!isViewMode && (
          <TouchableOpacity 
            onPress={() => setShowModeSelector(true)} 
            style={styles.modeButton}
          >
            <Ionicons name="options-outline" size={24} color="#3F9142" />
          </TouchableOpacity>
        )}
        {isViewMode && <View style={styles.placeholder} />}
      </View>

      {/* Mode selector modal */}
      <Modal
        visible={showModeSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modeModalContent}>
            <Text style={styles.modalTitle}>Select Land Mapping Method</Text>
            <Text style={styles.modeDescription}>
              Choose how you want to mark your land boundary:
            </Text>
            
            <TouchableOpacity
              style={[
                styles.modeOption,
                selectionMode === 'draw' && styles.modeOptionSelected
              ]}
              onPress={() => {
                setSelectionMode('draw');
                setShowModeSelector(false);
              }}
            >
              <View style={styles.modeOptionIcon}>
                <Ionicons name="create-outline" size={32} color={selectionMode === 'draw' ? '#FFFFFF' : '#3F9142'} />
              </View>
              <View style={styles.modeOptionText}>
                <Text style={[styles.modeOptionTitle, selectionMode === 'draw' && styles.modeOptionTitleSelected]}>
                  Draw on Map
                </Text>
                <Text style={[styles.modeOptionDescription, selectionMode === 'draw' && styles.modeOptionDescriptionSelected]}>
                  Click points on the map to draw your land boundary
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeOption,
                selectionMode === 'track' && styles.modeOptionSelected
              ]}
              onPress={() => {
                setSelectionMode('track');
                setShowModeSelector(false);
              }}
            >
              <View style={styles.modeOptionIcon}>
                <Ionicons name="walk-outline" size={32} color={selectionMode === 'track' ? '#FFFFFF' : '#3F9142'} />
              </View>
              <View style={styles.modeOptionText}>
                <Text style={[styles.modeOptionTitle, selectionMode === 'track' && styles.modeOptionTitleSelected]}>
                  GPS Tracking
                </Text>
                <Text style={[styles.modeOptionDescription, selectionMode === 'track' && styles.modeOptionDescriptionSelected]}>
                  Walk around your land and add GPS points to create boundary
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModeSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GPS Tracking Controls */}
      {selectionMode === 'track' && !isViewMode && (
        <View style={styles.trackingControls}>
          {!isTracking ? (
            <TouchableOpacity style={styles.startTrackingButton} onPress={startLocationTracking}>
              <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              <Text style={styles.startTrackingText}>Start GPS Tracking</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeTrackingControls}>
              <Text style={styles.trackingStatus}>
                GPS Tracking Active • {trackingPoints.length} points
              </Text>
              
              <View style={styles.trackingButtonsRow}>
                <TouchableOpacity style={styles.addPointButton} onPress={addTrackingPoint}>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.addPointText}>Add Point</Text>
                </TouchableOpacity>
                
                {trackingPoints.length >= 3 && (
                  <TouchableOpacity style={styles.finishTrackingButton} onPress={finishTracking}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.finishTrackingText}>Finish</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.cancelTrackingButton} onPress={cancelTracking}>
                  <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.cancelTrackingText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

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
                <Text style={styles.summaryText}>
                  Points: {selectionMode === 'track' ? trackingPoints.length : coordinates.length}
                </Text>
                <Text style={styles.summaryText}>
                  Method: {selectionMode === 'track' ? 'GPS Tracking' : 'Map Drawing'}
                </Text>
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
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 16,
    color: '#6F6F6F',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
  modeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#F9F9F9',
  },
  modeOptionSelected: {
    backgroundColor: '#3F9142',
    borderColor: '#3F9142',
  },
  modeOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modeOptionText: {
    flex: 1,
  },
  modeOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  modeOptionTitleSelected: {
    color: '#FFFFFF',
  },
  modeOptionDescription: {
    fontSize: 14,
    color: '#6F6F6F',
    lineHeight: 20,
  },
  modeOptionDescriptionSelected: {
    color: '#E8F5E8',
  },
  trackingControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: 34, // Account for safe area
  },
  startTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F9142',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startTrackingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeTrackingControls: {
    gap: 16,
  },
  trackingStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3F9142',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackingButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addPointButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F9142',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  addPointText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  finishTrackingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  finishTrackingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelTrackingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  cancelTrackingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});