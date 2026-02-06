// Test script to verify Liftie API integration
const axios = require('axios');

async function testLiftieAPI() {
  console.log('🔍 Testing Liftie.info API for Mammoth Mountain...\n');

  try {
    console.log('📡 Calling Liftie API endpoint...');
    const response = await axios.get(
      'https://liftie.info/api/resort/mammoth-lakes',
      { timeout: 10000 }
    );

    console.log('✅ API Response Status:', response.status);
    console.log('\n📊 Resort Information:');
    console.log('  Resort:', response.data.name);
    console.log('  ID:', response.data.id);
    console.log('  Coordinates:', response.data.ll);
    console.log('  Status:', response.data.open ? 'OPEN ✅' : 'CLOSED ❌');

    console.log('\n🎿 Lift Statistics:');
    const liftStats = response.data.lifts.stats;
    console.log('  Open:', liftStats.open);
    console.log('  Closed:', liftStats.closed);
    console.log('  On Hold:', liftStats.hold);
    console.log('  Scheduled:', liftStats.scheduled);
    console.log('  Percentage Open:', liftStats.percentage.open + '%');

    console.log('\n📋 Individual Lifts:');
    const lifts = response.data.lifts.status;
    const liftNames = Object.keys(lifts);
    console.log('  Total Lifts:', liftNames.length);

    // Show first 5 lifts as examples
    console.log('\n  Sample Lifts:');
    liftNames.slice(0, 5).forEach(name => {
      const status = lifts[name];
      const emoji = status === 'open' ? '✅' : status === 'closed' ? '❌' : '⏸️';
      console.log(`    ${emoji} ${name}: ${status}`);
    });
    console.log('    ... and', liftNames.length - 5, 'more');

    console.log('\n🌤️ Weather Information:');
    if (response.data.weather) {
      const weather = response.data.weather;
      console.log('  Date:', weather.date);
      console.log('  Temperature:', weather.temperature?.max + '°F');
      console.log('  Conditions:', weather.conditions);
      console.log('  Forecast:', weather.text);
      console.log('  Weather Source:', weather.notice?.site || 'N/A');
    } else {
      console.log('  No weather data available');
    }

    console.log('\n📸 Webcams Available:', response.data.webcams?.length || 0);
    if (response.data.webcams && response.data.webcams.length > 0) {
      console.log('  Sample:', response.data.webcams[0].name);
    }

    console.log('\n⏱️ Last Updated:');
    if (response.data.timestamp) {
      console.log('  Lifts:', new Date(response.data.timestamp.lifts).toLocaleString());
      console.log('  Weather:', new Date(response.data.timestamp.weather).toLocaleString());
    }

    console.log('\n✅ Liftie API Test Complete!');
    console.log('\n💡 This API provides:');
    console.log('   • Real-time lift status for all lifts');
    console.log('   • Live weather from NOAA');
    console.log('   • No API key required');
    console.log('   • Free and open-source');
    console.log('   • Updates every 60 seconds');

    return true;

  } catch (error) {
    console.error('\n❌ Liftie API Test Failed!');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 404) {
        console.error('\n💡 SOLUTION: Resort not found. Check the resort ID.');
      } else if (error.response.status >= 500) {
        console.error('\n💡 SOLUTION: Liftie API is temporarily down. Try again later.');
      }
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Error:', error.message);
      console.error('\n💡 SOLUTION: Check your internet connection');
    } else {
      console.error('Error:', error.message);
    }

    return false;
  }
}

// Run the test
testLiftieAPI().then(success => {
  process.exit(success ? 0 : 1);
});
