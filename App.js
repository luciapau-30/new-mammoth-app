import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from './screens/MapScreen';
import RideTrackerScreen from './screens/RideTrackerScreen';
import RideHistoryScreen from './screens/RideHistoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen 
          name="Map" 
          component={MapScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 24 }}>🗺️</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="Track Ride" 
          component={RideTrackerScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 24 }}>⛷️</Text>
            ),
          }}
        />
        <Tab.Screen 
          name="History" 
          component={RideHistoryScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 24 }}>📊</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}