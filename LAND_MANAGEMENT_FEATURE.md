# Land Management Feature

## Overview
This feature allows users to select and manage their agricultural land using interactive map drawing capabilities. Users can draw polygon boundaries on a map to define their land plots, automatically calculate area, and get location information.

## Features Implemented

### 1. Account Screen Integration
- Added "Land Management" button in the account settings
- Route to land management screen from account page

### 2. Land Management Dashboard (`/land-management`)
- Display all user's saved lands
- Show land information: name, location, area, crop type
- Add new land functionality  
- Delete existing lands
- Empty state when no lands are added

### 3. Interactive Land Selector (`/land-selector`)
- Web-based Mapbox integration for precise drawing
- Draw polygon boundaries by clicking on map
- Real-time area calculation (converts to acres)
- Automatic location detection (city, country)
- Satellite imagery for accurate land identification
- Drawing tools with polygon creation and deletion

### 4. Land Data Structure
```typescript
interface LandData {
  id: string;
  userId: string;
  name: string;
  coordinates: Array<[number, number]>; // [longitude, latitude]
  area: number; // in acres
  country: string;
  city: string;
  cropType?: string;
  createdAt: string;
}
```

## Step-by-Step User Flow

1. **Access Land Management**
   - User goes to Account tab
   - Clicks "Land Management" in settings

2. **View Existing Lands**
   - See dashboard with all saved lands
   - View land details: name, area, location, crop type
   - Option to delete lands

3. **Add New Land**
   - Click "Add New Land"
   - Opens interactive map selector

4. **Draw Land Boundary**
   - Map opens centered on user's location
   - Click points on map to draw polygon boundary
   - Real-time feedback shows:
     - Number of points drawn
     - Calculated area
     - Location information
   - Minimum 3 points required for valid polygon

5. **Save Land**
   - Click "Finish Drawing" when boundary is complete
   - Enter land name (required)
   - Enter crop type (optional)
   - Review land summary (area, location, points)
   - Save to Firebase database

## Technical Implementation

### Map Integration
- Uses Mapbox GL JS via WebView for cross-platform compatibility
- Satellite imagery for accurate land visualization
- Polygon drawing tools with area calculation using Turf.js
- Reverse geocoding for location information

### Data Storage
- Firebase Firestore for land data persistence
- User-scoped data (lands associated with user ID)
- Real-time synchronization across devices

### Area Calculation
- Uses Turf.js library for accurate geometric calculations
- Converts from square meters to acres for user-friendly display
- Handles both small plots (shows in sq meters) and large areas (shows in acres)

### Location Services
- Uses Expo Location for user's current position
- Mapbox Geocoding API for reverse geocoding (coordinates to place names)
- Automatic map centering on user's location

## Configuration Required

### Environment Variables
- `EXPO_PUBLIC_MAPBOX_TOKEN`: Mapbox access token (already configured)
- Firebase configuration (already configured)

### Dependencies Added
- `@rnmapbox/maps`: Mapbox integration
- `expo-location`: Location services
- `react-native-webview`: Web-based map rendering

## Usage Instructions

1. **For Testing:**
   ```bash
   npm start
   # or
   expo start
   ```

2. **For Production:**
   - Ensure Mapbox token is valid and has sufficient quota
   - Configure appropriate Firebase security rules for `lands` collection
   - Test polygon drawing on various device sizes

## Future Enhancements
- Crop planning and calendar integration
- Weather data integration per land plot
- Soil quality analysis
- Land productivity tracking
- Export land boundaries as KML/GeoJSON
- Offline map caching
- Photo attachments for land plots
- Sharing land boundaries with other users