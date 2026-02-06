# Go Mammoth ⛷️

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

A React Native mobile application designed for skiers and snowboarders at Mammoth Mountain, California. Track real-time lift status, monitor weather conditions, and record your rides with GPS tracking—all in one place.

**Project Origin:** This app evolved from a previous web application, expanding into a full-featured mobile experience. It incorporates GPS tracking, interactive mapping, and real-time API integration to create a comprehensive tool for mountain riders.

##  Features

- **Real-time Lift Status** - Interactive map showing which lifts are open/closed with live updates
- **GPS Ride Recording** - Track your runs with speed, distance, elevation, and route mapping, similar to Strava 
- **Ride History** - Go back to see your rides with all stats 
- **Snow Report** - Current conditions, base depth, and fresh snow alerts
- **Powder Day Alerts** - Get notified when there's 6+ inches of fresh snow

## Screenshots & Demo

> **Note:** Screenshots and video demonstration coming soon! The app features:
> - Interactive lift map with real-time status indicators
> - GPS tracking interface showing speed, distance, and elevation
> - Ride history dashboard with detailed statistics
> - Snow condition reports and powder alerts



## Stack

- **React Native** with Expo
- **React Navigation** for multi-screen navigation
- **Expo Location** for GPS tracking
- **React Native Maps** for interactive maps
- **AsyncStorage** for local data persistence
- **Axios** for API calls
- **Liftie.info API** for real-time lift status and weather data (free, open-source)

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

Scan the QR code with Expo Go app (iOS/Android) to run on your device.

## 🧪 Testing

Test the Liftie API connection:
```bash
node test-liftie.js
```

This will verify:
- ✅ API connectivity
- ✅ Real-time lift data (25+ lifts)
- ✅ Weather conditions from NOAA
- ✅ Data freshness and timestamps

## 🔑 API Setup

**Good news!** This app uses the **free and open-source Liftie.info API** - no API key required!

### What Liftie Provides:
- ✅ Real-time lift status for all 25+ Mammoth Mountain lifts
- ✅ Live weather conditions and forecasts (via NOAA)
- ✅ Current temperature and snow conditions
- ✅ Automatic updates every 60 seconds
- ✅ No authentication, rate limits, or costs

### Why Liftie Over Web Scraping?

We chose to use Liftie's API instead of directly scraping Mammoth's website because:

1. **Reliability** - Liftie handles site changes; our app doesn't break when Mammoth updates their UI
2. **Simplicity** - Clean JSON vs. complex HTML parsing with Puppeteer
3. **Ethics** - Reduced server load; Liftie caches data for all users
4. **Legality** - Using a public API avoids Terms of Service concerns
5. **Maintenance** - Less code to maintain and debug

**Data Source**: [Liftie.info](https://liftie.info/resort/mammoth-lakes) | [GitHub](https://github.com/pirxpilot/liftie)

## 🚀 Future Enhancements

- [ ] Social features: Share rides with friends
- [ ] Offline mode: Cache lift status for areas with poor connectivity
- [ ] Apple Watch integration for quick stats
- [ ] Trail difficulty ratings and recommendations
- [ ] Integration with additional California resorts (Tahoe, Big Bear)
- [ ] Weather forecast predictions (24-48 hour outlook)

## 📱 Technical Highlights

- **Cross-platform compatibility**: Runs on both iOS and Android
- **Real-time data integration**: Live API updates for lift operations (60s refresh)
- **Location-based services**: GPS tracking with background location support
- **Persistent storage**: AsyncStorage for ride history and user preferences
- **Modular architecture**: Separate screen components for maintainability
- **Graceful degradation**: Fallback to demo data if API is unavailable
- **Smart API choice**: Uses Liftie.info over web scraping (see `API-DECISION.md` for rationale)

## 🤝 Acknowledgments

Built with React Native and Expo. Special thanks to the online development community for tutorials and resources that helped bring this project to life.

## 📄 License

This project is open source and available for educational purposes.
