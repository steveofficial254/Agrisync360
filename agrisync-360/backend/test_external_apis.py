#!/usr/bin/env python3
"""
Test script for external API integrations
Run this script to verify OpenWeatherMap and FAO APIs are working
"""

import os
import sys
from dotenv import load_dotenv

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.external_data_service import ExternalDataService

def main():
    print("🌱 Testing External Agricultural APIs for AgriSync 360")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    # Test coordinates (Nairobi, Kenya)
    lat, lon = -1.2921, 36.8219
    
    print(f"\n📍 Testing with coordinates: {lat}, {lon} (Nairobi, Kenya)")
    
    # Test 1: OpenWeatherMap Current Weather
    print("\n1️⃣ Testing OpenWeatherMap Current Weather...")
    try:
        weather = ExternalDataService.get_weather_data(lat, lon)
        if weather:
            print(f"✅ Success! Temperature: {weather.get('temperature')}°C")
            print(f"   Location: {weather.get('location')}")
            print(f"   Source: {weather.get('source')}")
        else:
            print("❌ Failed - No weather data returned")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: OpenWeatherMap Forecast
    print("\n2️⃣ Testing OpenWeatherMap 5-Day Forecast...")
    try:
        forecast = ExternalDataService.get_weather_forecast(lat, lon, 5)
        if forecast:
            print(f"✅ Success! Got {len(forecast)} days of forecast")
            for i, day in enumerate(forecast[:3]):
                print(f"   Day {i+1}: {day.get('temperature_max')}°C/{day.get('temperature_min')}°C")
        else:
            print("❌ Failed - No forecast data returned")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: FAO Crop Calendar
    print("\n3️⃣ Testing FAO Crop Calendar for Maize in Kenya...")
    try:
        calendar = ExternalDataService.get_crop_calendar("Kenya", "maize")
        if calendar:
            print(f"✅ Success! Got {len(calendar)} calendar activities")
            for i, activity in enumerate(calendar[:3]):
                print(f"   {i+1}. {activity.get('activity')}: {activity.get('description')}")
        else:
            print("❌ Failed - No calendar data returned")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Fallback Data
    print("\n4️⃣ Testing Fallback Data (when APIs fail)...")
    try:
        # This should work even without API keys
        fallback_weather = ExternalDataService._get_fallback_weather_data()
        fallback_forecast = ExternalDataService._get_fallback_forecast(3)
        fallback_calendar = ExternalDataService._get_fallback_crop_calendar("maize")
        
        print(f"✅ Fallback weather: {fallback_weather.get('temperature')}°C")
        print(f"✅ Fallback forecast: {len(fallback_forecast)} days")
        print(f"✅ Fallback calendar: {len(fallback_calendar)} activities")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Test completed!")
    print("\n📝 Next Steps:")
    print("1. Get your OpenWeatherMap API key from https://openweathermap.org/api")
    print("2. Add it to your .env file: OPENWEATHERMAP_API_KEY=your_key_here")
    print("3. Restart your Flask application")
    print("4. Test the weather endpoints in your app")

if __name__ == "__main__":
    main()
