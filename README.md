# “Go Mammoth” 

A React Native mobile app for skiers and snowboarders at Mammoth Mountain. Track lift status, weather conditions, and your rides all in one place!!!

##  Features

- **Real-time Lift Status** - Interactive map showing which lifts are open/closed with live updates
- **GPS Ride Recording** - Track your runs with speed, distance, elevation, and route mapping
- **Ride History** - View all your past rides with detailed statistics
- **Snow Report** - Current conditions, base depth, and fresh snow alerts
- **Powder Day Alerts** - Get notified when there's 6+ inches of fresh snow

## Pictures! 
[Add screenshots here]

## Video Demo



## Stack

- **React Native** with Expo
- **React Navigation** for multi-screen navigation
- **Expo Location** for GPS tracking
- **React Native Maps** for interactive maps
- **AsyncStorage** for local data persistence
- **Axios** for API calls
- **RapidAPI** for real-time lift data

## Setup & Installation
```bash
# Clone the repository
git clone https://github.com/luciapau-30/new-mammoth-app.git
cd new-mammoth-app

# Install dependencies
npm install

# Start the app
npx expo start
```

scan the QR code with Expo Go app (iOS/Android) to run on your device.

## 🔑 API Setup

need a RapidAPI key for lift status data:
1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to "Ski Resorts and Conditions" API (free tier available)
3. Add your API key to `screens/MapScreen.js`
