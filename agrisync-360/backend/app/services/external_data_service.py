"""
External Data Service - Integration with free agricultural APIs
"""
import requests
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class ExternalDataService:
    """Service for fetching data from external agricultural APIs"""
    
    @staticmethod
    def get_openweathermap_api_key() -> str:
        """Get OpenWeatherMap API key from environment"""
        api_key = os.getenv('OPENWEATHERMAP_API_KEY')
        if not api_key:
            logger.warning("OpenWeatherMap API key not found in environment")
        return api_key
    
    @staticmethod
    def get_weather_data(lat: float, lon: float) -> Dict:
        """
        Fetch current weather data from OpenWeatherMap
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Weather data dictionary
        """
        api_key = ExternalDataService.get_openweathermap_api_key()
        if not api_key:
            return ExternalDataService._get_fallback_weather_data()
        
        try:
            base_url = os.getenv('OPENWEATHERMAP_BASE_URL', 'https://api.openweathermap.org/data/2.5')
            url = f"{base_url}/weather"
            
            params = {
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric"  # Celsius
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Transform to our format
            return {
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "wind_speed": data["wind"]["speed"],
                "wind_direction": data["wind"].get("deg", 0),
                "weather_code": data["weather"][0]["id"],
                "description": data["weather"][0]["description"],
                "location": data["name"],
                "sunrise": datetime.fromtimestamp(data["sys"]["sunrise"]).strftime("%H:%M"),
                "sunset": datetime.fromtimestamp(data["sys"]["sunset"]).strftime("%H:%M"),
                "source": "openweathermap"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenWeatherMap API error: {e}")
            return ExternalDataService._get_fallback_weather_data()
        except KeyError as e:
            logger.error(f"OpenWeatherMap data parsing error: {e}")
            return ExternalDataService._get_fallback_weather_data()
    
    @staticmethod
    def get_weather_forecast(lat: float, lon: float, days: int = 5) -> List[Dict]:
        """
        Fetch weather forecast from OpenWeatherMap
        
        Args:
            lat: Latitude
            lon: Longitude
            days: Number of days to forecast
            
        Returns:
            List of daily forecast data
        """
        api_key = ExternalDataService.get_openweathermap_api_key()
        if not api_key:
            return ExternalDataService._get_fallback_forecast(days)
        
        try:
            base_url = os.getenv('OPENWEATHERMAP_BASE_URL', 'https://api.openweathermap.org/data/2.5')
            url = f"{base_url}/forecast"
            
            params = {
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Process 3-hourly forecasts into daily
            daily_forecasts = {}
            for item in data["list"]:
                date = datetime.fromtimestamp(item["dt"]).strftime("%Y-%m-%d")
                
                if date not in daily_forecasts:
                    daily_forecasts[date] = {
                        "date": date,
                        "temperature_max": item["main"]["temp_max"],
                        "temperature_min": item["main"]["temp_min"],
                        "humidity": item["main"]["humidity"],
                        "precipitation_mm": item.get("rain", {}).get("3h", 0),
                        "weather_code": item["weather"][0]["id"],
                        "description": item["weather"][0]["description"]
                    }
                else:
                    # Update max/min temperatures
                    daily_forecasts[date]["temperature_max"] = max(
                        daily_forecasts[date]["temperature_max"], 
                        item["main"]["temp_max"]
                    )
                    daily_forecasts[date]["temperature_min"] = min(
                        daily_forecasts[date]["temperature_min"], 
                        item["main"]["temp_min"]
                    )
                    daily_forecasts[date]["precipitation_mm"] += item.get("rain", {}).get("3h", 0)
            
            # Convert to list and limit to requested days
            forecasts = list(daily_forecasts.values())[:days]
            
            # Add disease risk calculation
            for forecast in forecasts:
                forecast["disease_risk"] = ExternalDataService._calculate_disease_risk(forecast)
                forecast["planting_window_available"] = ExternalDataService._check_planting_window(forecast)
            
            return forecasts
            
        except Exception as e:
            logger.error(f"Weather forecast error: {e}")
            return ExternalDataService._get_fallback_forecast(days)
    
    @staticmethod
    def get_crop_calendar(country: str, crop: str) -> List[Dict]:
        """
        Fetch crop calendar data from FAO API
        
        Args:
            country: Country name (e.g., "Kenya")
            crop: Crop name (e.g., "maize")
            
        Returns:
            List of calendar activities
        """
        try:
            base_url = os.getenv('FAO_API_BASE_URL', 'https://api.data.apps.fao.org/api/v2')
            
            # FAO crop calendar query
            query = f"""
            SELECT * FROM crop_calendar 
            WHERE country_name = '{country}' 
            AND crop_name = '{crop}'
            ORDER BY period_start
            """
            
            url = f"{base_url}/bigquery/?sql={query}"
            
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get("data"):
                return ExternalDataService._get_fallback_crop_calendar(crop)
            
            # Transform to our format
            calendar = []
            for item in data["data"]:
                calendar.append({
                    "activity": item.get("activity", "Unknown"),
                    "period_start": item.get("period_start", ""),
                    "period_end": item.get("period_end", ""),
                    "description": item.get("description", ""),
                    "crop": crop.lower(),
                    "country": country
                })
            
            return calendar
            
        except Exception as e:
            logger.error(f"FAO API error: {e}")
            return ExternalDataService._get_fallback_crop_calendar(crop)
    
    @staticmethod
    def _calculate_disease_risk(weather_data: Dict) -> str:
        """Calculate disease risk based on weather conditions"""
        humidity = weather_data.get("humidity", 50)
        temp = weather_data.get("temperature_max", 25)
        precipitation = weather_data.get("precipitation_mm", 0)
        
        # Simple disease risk algorithm
        if humidity > 80 and precipitation > 5:
            return "very_high"
        elif humidity > 70 and precipitation > 2:
            return "high"
        elif humidity > 60 and precipitation > 0:
            return "medium"
        else:
            return "low"
    
    @staticmethod
    def _check_planting_window(weather_data: Dict) -> bool:
        """Check if conditions are suitable for planting"""
        temp = weather_data.get("temperature_max", 25)
        precipitation = weather_data.get("precipitation_mm", 0)
        
        # Good planting conditions: moderate temperature, adequate moisture
        return (15 <= temp <= 30) and (2 <= precipitation <= 10)
    
    @staticmethod
    def _get_fallback_weather_data() -> Dict:
        """Fallback weather data when API is unavailable"""
        return {
            "temperature": 25,
            "humidity": 65,
            "pressure": 1013,
            "wind_speed": 10,
            "wind_direction": 180,
            "weather_code": 800,
            "description": "clear sky",
            "location": "Nairobi",
            "sunrise": "06:00",
            "sunset": "18:30",
            "source": "fallback"
        }
    
    @staticmethod
    def _get_fallback_forecast(days: int) -> List[Dict]:
        """Fallback forecast data when API is unavailable"""
        forecast = []
        base_date = datetime.now()
        
        for i in range(days):
            date = base_date + timedelta(days=i)
            forecast.append({
                "date": date.strftime("%Y-%m-%d"),
                "temperature_max": 25 + (i % 5),
                "temperature_min": 18 + (i % 3),
                "humidity": 60 + (i % 20),
                "precipitation_mm": i % 7,
                "weather_code": 800,
                "description": "partly cloudy",
                "disease_risk": "low",
                "planting_window_available": i in [2, 3, 4]
            })
        
        return forecast
    
    @staticmethod
    def _get_fallback_crop_calendar(crop: str) -> List[Dict]:
        """Fallback crop calendar when API is unavailable"""
        # Basic calendar templates for common Kenyan crops
        calendars = {
            "maize": [
                {"activity": "Land preparation", "period_start": "March", "period_end": "April", "description": "Prepare soil and apply manure"},
                {"activity": "Planting", "period_start": "April", "period_end": "May", "description": "Plant hybrid maize seeds"},
                {"activity": "Weeding", "period_start": "May", "period_end": "June", "description": "First weeding"},
                {"activity": "Top dressing", "period_start": "June", "period_end": "July", "description": "Apply fertilizer"},
                {"activity": "Harvesting", "period_start": "August", "period_end": "September", "description": "Harvest mature maize"}
            ],
            "beans": [
                {"activity": "Land preparation", "period_start": "March", "period_end": "April", "description": "Prepare soil with organic matter"},
                {"activity": "Planting", "period_start": "April", "period_end": "May", "description": "Plant bean seeds with rhizobium"},
                {"activity": "Weeding", "period_start": "May", "period_end": "June", "description": "Light weeding"},
                {"activity": "Harvesting", "period_start": "July", "period_end": "August", "description": "Harvest dry beans"}
            ]
        }
        
        return calendars.get(crop.lower(), calendars.get("maize", []))
