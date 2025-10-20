import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

export default function MammothMapView() {
  const [selectedLift, setSelectedLift] = useState(null);
  const [lifts, setLifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [showWeather, setShowWeather] = useState(false);

  // Mammoth Mountain coordinates
  const mammothRegion = {
    latitude: 37.6308,
    longitude: -119.0326,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Fetch real-time lift data from SnoCountry API
  useEffect(() => {
    fetchLiftData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLiftData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiftData = async () => {
    try {
      setLoading(true);
      // RapidAPI Ski Resort Conditions
      const response = await axios.get(
        'https://ski-resort-conditions.p.rapidapi.com/get_snow_report',
        {
          params: {
            id: '1143859b' // Mammoth Mountain ID
          },
          headers: {
            'x-rapidapi-host': 'ski-resort-conditions.p.rapidapi.com',
            'x-rapidapi-key': '87f8a2e161mshaad318e941231b2p1f647djsn5fc3c2bc4f8a'
          }
        }
      );

      const data = response.data;
      
      if (data) {
        // Parse lift data from the report
        const liftData = parseLiftData(data);
        setLifts(liftData);
        setWeatherData(data); // Store full data for weather/snow report
        setError(null);
      } else {
        setError('No data available');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching lift data:', err);
      setError('Failed to load lift data');
      setLoading(false);
      // Use sample data as fallback
      setLifts(getSampleLifts());
    }
  };

  const parseLiftData = (resortData) => {
    // Sample lift locations (you'll need to add real coordinates)
    const liftLocations = {
      'Chair 1': { latitude: 37.6308, longitude: -119.0326 },
      'Gondola': { latitude: 37.6328, longitude: -119.0346 },
      'Chair 3': { latitude: 37.6288, longitude: -119.0306 },
      'Chair 23': { latitude: 37.6348, longitude: -119.0366 },
      'Broadway Express': { latitude: 37.6318, longitude: -119.0316 },
    };

    // Parse the lift info from RapidAPI response
    const liftsFromAPI = resortData.lifts || [];
    
    console.log('API Response:', resortData); // Debug log
    
    // If API has lift data, use it
    if (liftsFromAPI.length > 0) {
      return liftsFromAPI.map((lift, index) => {
        // Try to match with known coordinates
        const coords = liftLocations[lift.name] || {
          latitude: 37.6308 + (index * 0.002),
          longitude: -119.0326 + (index * 0.002)
        };
        
        return {
          id: index + 1,
          name: lift.name,
          latitude: coords.latitude,
          longitude: coords.longitude,
          status: lift.status || 'Unknown',
          lastUpdate: resortData.lastUpdated || new Date().toISOString()
        };
      });
    }
    
    // Fallback to estimating from totals
    const openLifts = resortData.liftsOpen || 0;
    const totalLifts = resortData.liftsTotal || 0;
    
    return Object.entries(liftLocations).map((entry, index) => {
      const [name, coords] = entry;
      const isOpen = index < openLifts;
      return {
        id: index + 1,
        name: name,
        latitude: coords.latitude,
        longitude: coords.longitude,
        status: isOpen ? 'Open' : 'Closed',
        lastUpdate: resortData.lastUpdated || new Date().toISOString()
      };
    });
  };

  const getSampleLifts = () => {
    return [
      { id: 1, name: 'Chair 1', latitude: 37.6308, longitude: -119.0326, status: 'Open' },
      { id: 2, name: 'Gondola', latitude: 37.6328, longitude: -119.0346, status: 'Open' },
      { id: 3, name: 'Chair 3', latitude: 37.6288, longitude: -119.0306, status: 'Closed' },
      { id: 4, name: 'Chair 23', latitude: 37.6348, longitude: -119.0366, status: 'On Hold' },
    ];
  };

  const getLiftColor = (status) => {
    switch(status) {
      case 'Open': return '#22c55e';
      case 'Closed': return '#ef4444';
      case 'On Hold': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading && lifts.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading lift data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        initialRegion={mammothRegion}
      >
        {lifts.map((lift) => (
          <Marker
            key={lift.id}
            coordinate={{
              latitude: lift.latitude,
              longitude: lift.longitude,
            }}
            pinColor={getLiftColor(lift.status)}
            onPress={() => setSelectedLift(lift)}
          />
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Lift Status</Text>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Open</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>On Hold</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Closed</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchLiftData}
        >
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Weather/Snow Report Button */}
      <TouchableOpacity 
        style={styles.weatherButton}
        onPress={() => setShowWeather(!showWeather)}
      >
        <Text style={styles.weatherButtonText}>
          {showWeather ? '📍 Map' : '⛷️ Snow Report'}
        </Text>
      </TouchableOpacity>

      {/* Weather/Snow Report Card */}
      {showWeather && weatherData && (
        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherTitle}>Mammoth Mountain</Text>
            <TouchableOpacity 
              onPress={() => setShowWeather(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Lifts/Trails Stats - Always show this */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weatherData.liftsOpen || 0}/{weatherData.liftsTotal || 0}</Text>
              <Text style={styles.statLabel}>Lifts Open</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weatherData.trailsOpen || 0}/{weatherData.trailsTotal || 0}</Text>
              <Text style={styles.statLabel}>Trails Open</Text>
            </View>
          </View>

          {/* Temperature - if available */}
          {weatherData.weather?.temp && (
            <View style={styles.tempSection}>
              <Text style={styles.tempBig}>{weatherData.weather.temp}°F</Text>
              <Text style={styles.tempLabel}>{weatherData.weather.condition || 'Current'}</Text>
            </View>
          )}

          {/* Snow Report - if available */}
          {(weatherData.snowReport || weatherData.baseDepth || weatherData.newSnow) && (
            <View style={styles.snowSection}>
              <Text style={styles.sectionTitle}>❄️ Snow Report</Text>
              <View style={styles.snowGrid}>
                {(weatherData.snowReport?.baseDepth || weatherData.baseDepth) && (
                  <View style={styles.snowItem}>
                    <Text style={styles.snowValue}>
                      {weatherData.snowReport?.baseDepth || weatherData.baseDepth}"
                    </Text>
                    <Text style={styles.snowLabel}>Base Depth</Text>
                  </View>
                )}
                {(weatherData.snowReport?.overnight || weatherData.newSnow) && (
                  <View style={styles.snowItem}>
                    <Text style={styles.snowValue}>
                      {weatherData.snowReport?.overnight || weatherData.newSnow}"
                    </Text>
                    <Text style={styles.snowLabel}>New Snow</Text>
                  </View>
                )}
                {weatherData.snowReport?.last24 && (
                  <View style={styles.snowItem}>
                    <Text style={styles.snowValue}>{weatherData.snowReport.last24}"</Text>
                    <Text style={styles.snowLabel}>24 Hours</Text>
                  </View>
                )}
                {weatherData.snowReport?.last7Days && (
                  <View style={styles.snowItem}>
                    <Text style={styles.snowValue}>{weatherData.snowReport.last7Days}"</Text>
                    <Text style={styles.snowLabel}>7 Days</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Conditions - if available */}
          {weatherData.conditions && (
            <View style={styles.conditionsSection}>
              <Text style={styles.sectionTitle}>🎿 Conditions</Text>
              <Text style={styles.conditionText}>{weatherData.conditions}</Text>
            </View>
          )}

          {/* Show raw data for debugging */}
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => console.log('Full API Data:', JSON.stringify(weatherData, null, 2))}
          >
            <Text style={styles.debugText}>📊 Show All Data (check console)</Text>
          </TouchableOpacity>

          {weatherData.lastUpdated && (
            <Text style={styles.lastUpdate}>
              Updated: {new Date(weatherData.lastUpdated).toLocaleString()}
            </Text>
          )}
        </View>
      )}

      {/* Selected Lift Info */}
      {selectedLift && (
        <View style={styles.liftInfo}>
          <View style={styles.liftHeader}>
            <Text style={styles.liftName}>{selectedLift.name}</Text>
            <TouchableOpacity 
              onPress={() => setSelectedLift(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getLiftColor(selectedLift.status) }]} />
            <Text style={[styles.statusText, { color: getLiftColor(selectedLift.status) }]}>
              {selectedLift.status}
            </Text>
          </View>
          {selectedLift.lastUpdate && (
            <Text style={styles.updateText}>
              Last updated: {new Date(selectedLift.lastUpdate).toLocaleTimeString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  legend: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#4b5563',
  },
  refreshButton: {
    marginTop: 10,
    backgroundColor: '#2563eb',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  liftInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  liftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liftName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: '#9ca3af',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  weatherButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weatherButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  weatherCard: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    maxHeight: '70%',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  weatherTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tempSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  tempBig: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  tempLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 5,
  },
  snowSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  snowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  snowItem: {
    width: '48%',
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  snowValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  snowLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  conditionsSection: {
    marginBottom: 20,
  },
  conditionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  lastUpdate: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  debugButton: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
  },
});