import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RideTrackerScreen() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [startElevation, setStartElevation] = useState(null);
  const [duration, setDuration] = useState(0);
  const locationSubscription = useRef(null);
  const startTime = useRef(null);
  const timerInterval = useRef(null);

  // Mammoth Mountain region
  const initialRegion = {
    latitude: 37.6308,
    longitude: -119.0326,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location permission is required to track rides');
    }
  };

  const startTracking = async () => {
    setIsTracking(true);
    setRouteCoordinates([]);
    setDistance(0);
    setSpeed(0);
    setMaxSpeed(0);
    setDuration(0);
    startTime.current = Date.now();

    // Start timer
    timerInterval.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    // Get initial location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    setCurrentLocation(location.coords);
    setStartElevation(location.coords.altitude);
    setRouteCoordinates([{
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }]);

    // Start tracking
    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5, // Update every 5 meters
        timeInterval: 1000, // Update every second
      },
      (location) => {
        const { latitude, longitude, speed: currentSpeed, altitude } = location.coords;
        
        setCurrentLocation(location.coords);
        
        // Update speed (convert m/s to mph)
        const speedMph = currentSpeed ? (currentSpeed * 2.237).toFixed(1) : 0;
        setSpeed(speedMph);
        if (speedMph > maxSpeed) {
          setMaxSpeed(speedMph);
        }

        // Update elevation
        if (altitude && startElevation) {
          setElevation(Math.round(startElevation - altitude));
        }

        // Add to route
        setRouteCoordinates((prev) => {
          const newCoords = [...prev, { latitude, longitude }];
          
          // Calculate distance
          if (prev.length > 0) {
            const lastCoord = prev[prev.length - 1];
            const dist = calculateDistance(
              lastCoord.latitude,
              lastCoord.longitude,
              latitude,
              longitude
            );
            setDistance((prevDist) => prevDist + dist);
          }
          
          return newCoords;
        });
      }
    );
  };

  const stopTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    // Save ride
    const ride = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration,
      distance: distance.toFixed(2),
      maxSpeed: maxSpeed.toFixed(1),
      elevation: elevation,
      coordinates: routeCoordinates,
    };

    await saveRide(ride);
    
    setIsTracking(false);
    
    Alert.alert(
      'Ride Saved! 🎿',
      `Distance: ${distance.toFixed(2)} mi\nMax Speed: ${maxSpeed.toFixed(1)} mph\nVertical: ${elevation} ft`,
      [{ text: 'OK' }]
    );
  };

  const saveRide = async (ride) => {
    try {
      const existingRides = await AsyncStorage.getItem('rides');
      const rides = existingRides ? JSON.parse(existingRides) : [];
      rides.unshift(ride);
      await AsyncStorage.setItem('rides', JSON.stringify(rides));
    } catch (error) {
      console.error('Error saving ride:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value) => {
    return (value * Math.PI) / 180;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        region={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : initialRegion}
        showsUserLocation={true}
        followsUserLocation={isTracking}
      >
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2563eb"
            strokeWidth={4}
          />
        )}
        {routeCoordinates.length > 0 && (
          <Marker
            coordinate={routeCoordinates[0]}
            title="Start"
            pinColor="green"
          />
        )}
      </MapView>

      {/* Stats Overlay */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{speed}</Text>
          <Text style={styles.statLabel}>mph</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
          <Text style={styles.statLabel}>miles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{elevation}</Text>
          <Text style={styles.statLabel}>ft drop</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          <Text style={styles.statLabel}>time</Text>
        </View>
      </View>

      {/* Control Button */}
      <View style={styles.controlContainer}>
        {!isTracking ? (
          <TouchableOpacity
            style={[styles.controlButton, styles.startButton]}
            onPress={startTracking}
          >
            <Text style={styles.buttonText}>🎿 Start Tracking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={stopTracking}
          >
            <Text style={styles.buttonText}>⏹ Stop & Save</Text>
          </TouchableOpacity>
        )}
      </View>

      {isTracking && (
        <View style={styles.recordingIndicator}>
          <View style={styles.redDot} />
          <Text style={styles.recordingText}>Recording</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  controlContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  controlButton: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  startButton: {
    backgroundColor: '#22c55e',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});