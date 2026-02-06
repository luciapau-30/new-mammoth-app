import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

/*
 * DATA SOURCE DECISION: Liftie API
 *
 * Why Liftie over web scraping Mammoth's site directly?
 *
 * PROS OF LIFTIE:
 * - Free, open-source API with no authentication needed
 * - Returns structured JSON (easy to parse vs. HTML scraping)
 * - Maintained by community - they handle Mammoth's site changes
 * - Built-in caching (60s) reduces load on Mammoth's servers
 * - No CORS issues, no backend proxy needed
 * - No legal gray area (scraping ToS concerns)
 * - Lower maintenance - API rarely breaks vs. HTML selectors
 *
 * CONS OF DIRECT SCRAPING:
 * - Mammoth uses React (requires Puppeteer/headless browser)
 * - Fragile - breaks when Mammoth updates their UI
 * - Performance overhead (full page download + rendering)
 * - Ethical concerns (puts load on Mammoth's servers)
 * - Could violate Terms of Service
 * - More complex code (100+ lines vs. simple fetch)
 *
 * DECISION: Use Liftie API as primary source, fall back to demo data if unavailable.
 */

export default function MammothMapView() {
  const [selectedLift, setSelectedLift] = useState(null);
  const [lifts, setLifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [showWeather, setShowWeather] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

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

      // Liftie.info API - Free, no auth required
      // Endpoint: https://liftie.info/api/resort/{resort-id}
      // Documentation: https://github.com/pirxpilot/liftie
      const response = await axios.get(
        'https://liftie.info/api/resort/mammoth-lakes',
        {
          timeout: 10000 // 10 second timeout
        }
      );

      const data = response.data;

      console.log('✅ Liftie API Response received');
      console.log('Lifts open:', data.lifts?.stats?.open, '/', Object.keys(data.lifts?.status || {}).length);
      console.log('Weather:', data.weather?.temperature?.max + '°F', data.weather?.conditions);

      if (data && data.lifts && data.lifts.status) {
        // Parse Liftie data format
        const liftData = parseLiftieData(data);
        setLifts(liftData);
        setWeatherData(data); // Store full data for weather/snow report
        setError(null);
        setUsingFallbackData(false);
      } else {
        throw new Error('Invalid data format from Liftie API');
      }
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching lift data:', err);
      console.error('Error details:', err.response?.data || err.message);

      // Determine specific error message
      let errorMessage = 'Using demo data - ';
      if (err.code === 'ECONNABORTED') {
        errorMessage += 'API request timed out';
      } else if (err.response?.status === 404) {
        errorMessage += 'Resort data not found';
      } else if (err.response?.status >= 500) {
        errorMessage += 'Liftie API temporarily down';
      } else if (!navigator.onLine) {
        errorMessage += 'No internet connection';
      } else {
        errorMessage += 'API connection failed';
      }

      setError(errorMessage);
      setLoading(false);
      setUsingFallbackData(true);
      // Use sample data as fallback
      setLifts(getSampleLifts());
    }
  };

  const parseLiftieData = (liftieData) => {
    /*
     * Liftie API returns:
     * {
     *   lifts: {
     *     status: { "Broadway Express 1": "open", "Chair 20": "closed", ... },
     *     stats: { open: 24, closed: 1, ... }
     *   },
     *   ll: [-119.037346, 37.651772],  // [longitude, latitude]
     *   timestamp: { lifts: 1234567890 }
     * }
     */

    // Estimated lift locations spread around Mammoth Mountain
    // In production, these could come from a database or more precise mapping
    const baseLat = liftieData.ll ? liftieData.ll[1] : 37.651772;
    const baseLon = liftieData.ll ? liftieData.ll[0] : -119.037346;

    const liftsStatus = liftieData.lifts.status;
    const liftNames = Object.keys(liftsStatus);

    // Convert Liftie format to our app format
    return liftNames.map((liftName, index) => {
      const status = liftsStatus[liftName];

      // Spread lifts around the mountain (simplified distribution)
      // In a real app, you'd have actual GPS coordinates for each lift
      const angle = (index / liftNames.length) * 2 * Math.PI;
      const radius = 0.01; // ~1km spread
      const latitude = baseLat + (Math.cos(angle) * radius);
      const longitude = baseLon + (Math.sin(angle) * radius);

      return {
        id: index + 1,
        name: liftName,
        latitude: latitude,
        longitude: longitude,
        status: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize: "open" -> "Open"
        lastUpdate: liftieData.timestamp?.lifts
          ? new Date(liftieData.timestamp.lifts).toISOString()
          : new Date().toISOString()
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
        {usingFallbackData && (
          <View style={styles.demoBadge}>
            <Text style={styles.demoText}>DEMO DATA</Text>
          </View>
        )}
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
        <View style={[styles.errorBanner, usingFallbackData && styles.warningBanner]}>
          <Text style={[styles.errorText, usingFallbackData && styles.warningText]}>
            {usingFallbackData ? '⚠️' : '❌'} {error}
          </Text>
          {usingFallbackData && (
            <Text style={styles.errorSubtext}>
              Check console for details or verify API key
            </Text>
          )}
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
            <Text style={styles.weatherTitle}>{weatherData.name || 'Mammoth Mountain'}</Text>
            <TouchableOpacity
              onPress={() => setShowWeather(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Lifts Stats from Liftie */}
          {weatherData.lifts?.stats && (
            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {weatherData.lifts.stats.open}/{Object.keys(weatherData.lifts.status).length}
                </Text>
                <Text style={styles.statLabel}>Lifts Open</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weatherData.lifts.stats.percentage.open}%</Text>
                <Text style={styles.statLabel}>Operational</Text>
              </View>
            </View>
          )}

          {/* Temperature - from Liftie weather data */}
          {weatherData.weather?.temperature?.max && (
            <View style={styles.tempSection}>
              <Text style={styles.tempBig}>{weatherData.weather.temperature.max}°F</Text>
              <Text style={styles.tempLabel}>{weatherData.weather.conditions || 'Current Conditions'}</Text>
            </View>
          )}

          {/* Weather Forecast Text */}
          {weatherData.weather?.text && (
            <View style={styles.conditionsSection}>
              <Text style={styles.sectionTitle}>🌤️ Forecast</Text>
              <Text style={styles.conditionText}>{weatherData.weather.text}</Text>
              {weatherData.weather.date && (
                <Text style={styles.forecastDate}>
                  For {new Date(weatherData.weather.date).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {/* Resort Status */}
          {weatherData.open !== undefined && (
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>🏔️ Resort Status</Text>
              <View style={[styles.statusBadge, weatherData.open ? styles.openBadge : styles.closedBadge]}>
                <Text style={styles.statusBadgeText}>
                  {weatherData.open ? '✅ OPEN' : '❌ CLOSED'}
                </Text>
              </View>
            </View>
          )}

          {/* Data Source Attribution */}
          <View style={styles.attributionSection}>
            <Text style={styles.attributionText}>
              Data from Liftie.info • Updated every 60 seconds
            </Text>
            {weatherData.weather?.notice && (
              <Text style={styles.attributionSubtext}>
                Weather: {weatherData.weather.notice.site || 'NOAA'}
              </Text>
            )}
          </View>

          {weatherData.timestamp?.lifts && (
            <Text style={styles.lastUpdate}>
              Last updated: {new Date(weatherData.timestamp.lifts).toLocaleTimeString()}
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
  demoBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  demoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    textAlign: 'center',
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
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#991b1b',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    color: '#92400e',
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
  forecastDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 5,
    fontStyle: 'italic',
  },
  statusSection: {
    marginBottom: 15,
  },
  openBadge: {
    backgroundColor: '#d1fae5',
    borderColor: '#22c55e',
  },
  closedBadge: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  attributionSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  attributionText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  attributionSubtext: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 3,
  },
});