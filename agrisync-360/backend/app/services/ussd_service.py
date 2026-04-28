from app.models.farmer import Farmer
from app.services.market_service import MarketService
from app.services.weather_service import WeatherService
from app.utils.helpers import normalize_phone


class USSDService:
    MENU_MAIN = """
CON Welcome to AgriSync 360
1. My Weather Forecast
2. Crop Advisory
3. Market Prices
4. My Farm Profile
5. Subscribe/Renew
0. Exit
""".strip()

    def handle_session(self, session_id, service_code, phone, text):
        _ = session_id, service_code
        if not text:
            return self.MENU_MAIN
        parts = text.split("*")
        if parts[0] == "1":
            return self.get_weather_response(phone)
        if parts[0] == "2":
            if len(parts) == 1:
                return "CON Select crop\n1. Maize\n2. Beans\n3. Potatoes"
            mapping = {"1": "maize", "2": "beans", "3": "potatoes"}
            crop = mapping.get(parts[1], "maize")
            return f"END {crop.title()} tip: Weed early and scout pests twice weekly."
        if parts[0] == "3":
            if len(parts) == 1:
                return "CON Select crop\n1. Maize\n2. Beans\n3. Tomatoes"
            return self.get_market_prices_response(parts[1])
        if parts[0] == "4":
            p = Farmer.query.join(Farmer.user).filter_by(phone=normalize_phone(phone)).first()
            return f"END Profile: {p.full_name if p else 'Not found'}"
        if parts[0] == "5":
            return "END Dial *334# to renew your AgriSync 360 subscription."
        return "END Thank you for using AgriSync 360"

    def get_weather_response(self, phone):
        farmer = Farmer.query.join(Farmer.user).filter_by(phone=normalize_phone(phone)).first()
        if not farmer:
            return "END Farmer profile not found."
        farm = farmer.farms.filter_by(is_primary=True, is_deleted=False).first() or farmer.farms.first()
        if not farm:
            return "END No farm profile found."
        lat, lon = farm.get_coordinates()
        forecast = WeatherService.get_forecast(lat, lon)
        today = forecast[0]
        msg = f"END Wx:{today['temperature_min']}-{today['temperature_max']}C Rain:{today['precipitation_mm']}mm Risk:{today['disease_risk_level']}"
        return msg[:182]

    def get_market_prices_response(self, crop_choice):
        mapping = {"1": "maize", "2": "beans", "3": "tomatoes"}
        crop = mapping.get(crop_choice, "maize")
        prices = MarketService.get_current_prices(crop, None)
        if not prices:
            return "END No market data available"
        lines = [f"{p['market_name']}: KES {p['price_per_kg']}/kg" for p in prices[:3]]
        return ("END " + " | ".join(lines))[:182]
