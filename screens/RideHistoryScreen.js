import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RideHistoryScreen() {
  const [rides, setRides] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalDistance: 0,
    totalRides: 0,
    totalVertical: 0,
  });

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const storedRides = await AsyncStorage.getItem('rides');
      if (storedRides) {
        const ridesData = JSON.parse(storedRides);
        setRides(ridesData);
        calculateTotalStats(ridesData);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const calculateTotalStats = (ridesData) => {
    const stats = ridesData.reduce((acc, ride) => {
      return {
        totalDistance: acc.totalDistance + parseFloat(ride.distance),
        totalRides: acc.totalRides + 1,
        totalVertical: acc.totalVertical + parseInt(ride.elevation),
      };
    }, { totalDistance: 0, totalRides: 0, totalVertical: 0 });
    
    setTotalStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const deleteRide = (rideId) => {
    Alert.alert(
      'Delete Ride',
      'Are you sure you want to delete this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedRides = rides.filter(r => r.id !== rideId);
            setRides(updatedRides);
            await AsyncStorage.setItem('rides', JSON.stringify(updatedRides));
            calculateTotalStats(updatedRides);
          },
        },
      ]
    );
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const renderRideItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.rideCard}
      onLongPress={() => deleteRide(item.id)}
    >
      <View style={styles.rideHeader}>
        <Text style={styles.rideDate}>{formatDate(item.date)}</Text>
        <Text style={styles.rideDuration}>{formatDuration(item.duration)}</Text>
      </View>
      
      <View style={styles.rideStats}>
        <View style={styles.rideStat}>
          <Text style={styles.rideStatValue}>{item.distance} mi</Text>
          <Text style={styles.rideStatLabel}>Distance</Text>
        </View>
        <View style={styles.rideStat}>
          <Text style={styles.rideStatValue}>{item.maxSpeed} mph</Text>
          <Text style={styles.rideStatLabel}>Max Speed</Text>
        </View>
        <View style={styles.rideStat}>
          <Text style={styles.rideStatValue}>{item.elevation} ft</Text>
          <Text style={styles.rideStatLabel}>Vertical</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with total stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Stats</Text>
        <View style={styles.totalStatsContainer}>
          <View style={styles.totalStatCard}>
            <Text style={styles.totalStatValue}>{totalStats.totalRides}</Text>
            <Text style={styles.totalStatLabel}>Total Rides</Text>
          </View>
          <View style={styles.totalStatCard}>
            <Text style={styles.totalStatValue}>{totalStats.totalDistance.toFixed(1)}</Text>
            <Text style={styles.totalStatLabel}>Miles</Text>
          </View>
          <View style={styles.totalStatCard}>
            <Text style={styles.totalStatValue}>{totalStats.totalVertical.toLocaleString()}</Text>
            <Text style={styles.totalStatLabel}>Vertical (ft)</Text>
          </View>
        </View>
      </View>

      {/* Rides list */}
      {rides.length > 0 ? (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={renderRideItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⛷️</Text>
          <Text style={styles.emptyTitle}>No rides yet!</Text>
          <Text style={styles.emptyText}>
            Start tracking your first ride from the Track Ride tab
          </Text>
        </View>
      )}

      <Text style={styles.hint}>Long press to delete a ride</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  totalStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  totalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  totalStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
  },
  rideCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rideDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  rideDuration: {
    fontSize: 14,
    color: '#6b7280',
  },
  rideStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rideStat: {
    alignItems: 'center',
  },
  rideStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  rideStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    padding: 10,
    fontStyle: 'italic',
  },
});