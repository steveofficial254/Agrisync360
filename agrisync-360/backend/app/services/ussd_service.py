import logging
from datetime import datetime

from app.services.weather_service import WeatherService
from app.services.market_service import MarketService
from app.services.mpesa_service import MpesaService
from app.services.sms_service import SMSService
from app.models.user import User
from app.models.farmer import Farmer
from app.models.advisory import Advisory
from app.extensions import redis_client
import json

logger = logging.getLogger(__name__)


class USSDService:
    
    CROP_MAP = {
        '1': 'maize', '2': 'beans', '3': 'potatoes',
        '4': 'tomatoes', '5': 'tea'
    }
    
    CROP_SWAHILI = {
        'maize': 'Mahindi', 'beans': 'Maharagwe',
        'potatoes': 'Viazi', 'tomatoes': 'Nyanya', 'tea': 'Chai'
    }
    
    @classmethod
    def handle(cls, session_id, service_code, phone_number, text):
        """
        Main entry point for USSD requests from Africa's Talking.
        Returns: string starting with CON (continue) or END (terminate)
        """
        # Normalize inputs
        text = text.strip() if text else ''
        parts = text.split('*') if text else []
        level = len(parts)
        
        # Route to correct handler
        if text == '':
            return cls._main_menu()
        elif parts[0] == '1':
            return cls._weather_menu(parts, phone_number)
        elif parts[0] == '2':
            return cls._advisory_menu(parts)
        elif parts[0] == '3':
            return cls._market_menu(parts)
        elif parts[0] == '4':
            return cls._account_menu(parts, phone_number)
        elif parts[0] == '5':
            return cls._subscribe_menu(parts, phone_number)
        elif parts[0] == '0':
            return "END Asante kwa kutumia AgriSync 360!\nKwa msaada: 0722 000 360"
        else:
            return cls._main_menu()
    
    @classmethod
    def _main_menu(cls):
        """Main USSD menu"""
        return """CON Welcome to AgriSync 360 🌱
Habari ya shamba lako leo!
1. Hali ya Hewa (Weather)
2. Ushauri wa Mazao (Crop Advisory)
3. Bei za Soko (Market Prices)
4. Akaunti Yangu (My Account)
5. Jiunge Nawe (Subscribe)
0. Toka (Exit)"""
    
    @classmethod
    def _weather_menu(cls, parts, phone_number):
        """Weather menu handlers"""
        if len(parts) == 1:
            return """CON Hali ya Hewa - Weather
1. Utabiri wa Leo (Today's Forecast)
2. Utabiri wa Wiki (7-Day Forecast)
3. Hatari ya Magonjwa (Disease Risk)
0. Rudi Nyuma (Back)"""
        
        elif parts[1] == '1':
            return cls._today_weather(phone_number)
        elif parts[1] == '2':
            return cls._week_forecast()
        elif parts[1] == '3':
            return cls._disease_risk(phone_number)
        elif parts[1] == '0':
            return cls._main_menu()
        else:
            return cls._weather_menu(['1'], phone_number)
    
    @classmethod
    def _today_weather(cls, phone_number):
        """Get today's weather for farmer's location"""
        try:
            # Get farmer's location
            farmer = cls._get_farmer_by_phone(phone_number)
            if farmer and farmer.farms:
                # Use first farm's location
                farm = farmer.farms[0]
                lat, lon = farm.get_coordinates()
            else:
                # Default to Nairobi
                lat, lon = -1.2921, 36.8219
            
            # Get weather forecast
            forecast = WeatherService.get_forecast(lat, lon)
            if not forecast or not forecast.get('forecast'):
                return cls._error_response("Samahani, hatuwezi kupata taarifa ya hewa. Jaribu tena.")
            
            today = forecast['forecast'][0]
            temp_min = today.get('temp_min', 'N/A')
            temp_max = today.get('temp_max', 'N/A')
            rain = today.get('rainfall', 0)
            humidity = today.get('humidity_percent', 'N/A')
            disease_risk = today.get('disease_risk', 'Wastani')
            
            location = farmer.county if farmer else "Nairobi"
            
            response = f"""END Hali ya Hewa - {location}
Joto: {temp_min}°C - {temp_max}°C
Mvua: {rain}mm
Unyevu: {humidity}%
Hali: Mvua kidogo
Hatari ya Magonjwa: {disease_risk}
AgriSync 360"""
            
            # Ensure response is under 182 characters
            if len(response) > 182:
                response = f"""END Hali ya Hewa - {location}
Joto: {temp_min}-{temp_max}°C
Mvua: {rain}mm
Unyevu: {humidity}%
Hatari: {disease_risk}
AgriSync 360"""
            
            return response
            
        except Exception as e:
            logger.error(f"USSD weather error: {str(e)}")
            return cls._error_response("Samahani, kuna tatizo la hewa. Jaribu tena.")
    
    @classmethod
    def _week_forecast(cls):
        """Get 7-day weather summary"""
        try:
            # Default to Nairobi for simplicity
            lat, lon = -1.2921, 36.8219
            forecast = WeatherService.get_forecast(lat, lon)
            
            if not forecast or not forecast.get('forecast'):
                return cls._error_response("Samahani, hatuwezi kupata utabiri. Jaribu tena.")
            
            days = forecast['forecast'][:7]  # First 7 days
            response_parts = ["END Utabiri 7 Siku:"]
            
            for i, day in enumerate(days[:4]):  # Show first 4 days to fit in 182 chars
                date_str = day.get('date', '')[5:]  # MM-DD format
                rain = day.get('rainfall', 0)
                temp_max = day.get('temp_max', 'N/A')
                
                day_str = f"{date_str}: Mvua {rain}mm, {temp_max}°C"
                response_parts.append(day_str)
            
            response_parts.append("AgriSync 360")
            return "\n".join(response_parts)
            
        except Exception as e:
            logger.error(f"USSD week forecast error: {str(e)}")
            return cls._error_response("Samahani, kuna tatizo la utabiri. Jaribu tena.")
    
    @classmethod
    def _disease_risk(cls, phone_number):
        """Get disease risk for farmer's location"""
        try:
            # Get farmer's location
            farmer = cls._get_farmer_by_phone(phone_number)
            if farmer and farmer.farms:
                farm = farmer.farms[0]
                lat, lon = farm.get_coordinates()
            else:
                lat, lon = -1.2921, 36.8219
            
            # Get weather forecast
            forecast = WeatherService.get_forecast(lat, lon)
            if not forecast or not forecast.get('forecast'):
                return cls._error_response("Samahani, hatuwezi kupata hatari. Jaribu tena.")
            
            today = forecast['forecast'][0]
            humidity = today.get('humidity_percent', 'N/A')
            temp = today.get('temp_max', 'N/A')
            disease_risk = today.get('disease_risk', 'WASTANI')
            
            # Get specific disease recommendations
            risk_level = "WASTANI"
            if humidity > 80:
                risk_level = "JUU"
            elif humidity > 70:
                risk_level = "KATI"
            
            recommendation = "Tumia dawa za kuzuia."
            if "JUU" in risk_level:
                recommendation = "Tahadhari: Ukungu. Tumia dawa za kuzuia."
            
            location = farmer.county if farmer else "Nairobi"
            
            response = f"""END Hatari ya Magonjwa:
Leo: {risk_level}
Unyevu {humidity}%, Joto {temp}°C
{recommendation}
AgriSync 360"""
            
            return response
            
        except Exception as e:
            logger.error(f"USSD disease risk error: {str(e)}")
            return cls._error_response("Samahani, kuna tatizo la hatari. Jaribu tena.")
    
    @classmethod
    def _advisory_menu(cls, parts):
        """Crop advisory menu handlers"""
        if len(parts) == 1:
            return """CON Ushauri wa Mazao
Chagua zao:
1. Mahindi (Maize)
2. Maharagwe (Beans)
3. Viazi (Potatoes)
4. Nyanya (Tomatoes)
5. Chai (Tea)
0. Rudi Nyuma"""
        
        elif len(parts) == 2:
            crop_num = parts[1]
            if crop_num in cls.CROP_MAP:
                crop = cls.CROP_MAP[crop_num]
                return cls._crop_advisory_menu(crop)
            else:
                return cls._advisory_menu(['2'])
        elif len(parts) >= 3:
            crop_num = parts[1]
            if crop_num not in cls.CROP_MAP:
                return cls._advisory_menu(['2'])
            
            crop = cls.CROP_MAP[crop_num]
            action = parts[2]
            
            if action == '1':
                return cls._planting_advice(crop)
            elif action == '2':
                return cls._nutrition_advice(crop)
            elif action == '3':
                return cls._pest_advice(crop)
            elif action == '4':
                return cls._harvest_advice(crop)
            elif action == '0':
                return cls._advisory_menu(['2'])
            else:
                return cls._crop_advisory_menu(crop)
        else:
            return cls._advisory_menu(['2'])
    
    @classmethod
    def _crop_advisory_menu(cls, crop):
        """Show advisory options for specific crop"""
        crop_name = cls.CROP_SWAHILI.get(crop, crop.title())
        return f"""CON {crop_name} - Ushauri
1. Kupanda (Planting)
2. Mbolea (Nutrition)
3. Wadudu (Pest Control)
4. Mavuno (Harvest)
0. Rudi Nyuma"""
    
    @classmethod
    def _planting_advice(cls, crop):
        """Get planting advice for crop"""
        advice_map = {
            'maize': """END Kupanda Mahindi:
Panda mwanzo wa mvua.
Nafasi: 75cm x 25cm
Mbegu 2 kwa shimo.
Kina: 5cm.
Aina bora: H614D, DK8031
Omba ushauri zaidi:
0722 000 360
AgriSync 360""",
            'beans': """END Kupanda Maharagwe:
Panda baada ya mvua.
Nafasi: 50cm x 10cm
Mbegu 2 kwa shimo.
Kina: 3cm.
Aina bora: KAT B69, GLP 2
Omba ushauri zaidi:
0722 000 360
AgriSync 360""",
            'potatoes': """END Kupanda Viazi:
Panda katika ardhe yenye humus.
Nafasi: 75cm x 30cm
Mbegu 1 kwa shimo.
Kina: 10cm.
Aina bora: Sherekea, Tigoni
Omba ushauri zaidi:
0722 000 360
AgriSync 360"""
        }
        
        return advice_map.get(crop, cls._error_response("Ushauri haujapatikana kwa mazao haya."))
    
    @classmethod
    def _nutrition_advice(cls, crop):
        """Get nutrition advice for crop"""
        nutrition_map = {
            'maize': """END Mbolea Mahindi:
DAP: 125kg/acre
Urea: 50kg/acre
Mbolea ya juu: CAN 25kg/acre
Wekwa wakati wa kupanda.
Omba ushauri zaidi:
0722 000 360
AgriSync 360""",
            'beans': """END Mbolea Maharagwe:
DAP: 50kg/acre
Mbolea ya juu: CAN 20kg/acre
Wekwa wiki 2 baada ya kupanda.
Omba ushauri zaidi:
0722 000 360
AgriSync 360"""
        }
        
        return nutrition_map.get(crop, cls._error_response("Ushauri wa mbolea haujapatikana."))
    
    @classmethod
    def _pest_advice(cls, crop):
        """Get pest control advice for crop"""
        pest_map = {
            'maize': """END Wadudu Mahindi:
FAW: Tumia Dudu/Ampligo
Stalk borer: Tumia Regent
Weeds: Tumia Lancer/Lontrel
Pulizia mara 2-3.
Omba ushauri zaidi:
0722 000 360
AgriSync 360""",
            'beans': """END Wadudu Maharagwe:
Aphids: Tumia Karate/Confidor
Bean flies: Tumia Diazinon
Weeds: Tumia Basagran
Pulizia wiki 3 na 6.
Omba ushauri zaidi:
0722 000 360
AgriSync 360"""
        }
        
        return pest_map.get(crop, cls._error_response("Ushauri wa wadudu haujapatikana."))
    
    @classmethod
    def _harvest_advice(cls, crop):
        """Get harvest advice for crop"""
        harvest_map = {
            'maize': """END Mavuno Mahindi:
Vuna wakati wa kavu.
Mavuno: 90-120 siku.
Hifadhi kwenye magunia.
Yabisi: 13-15%.
Omba ushauri zaidi:
0722 000 360
AgriSync 360""",
            'beans': """END Mavuno Maharagwe:
Vuna wakati wa rangi njano.
Mavuno: 60-90 siku.
Hifadhi kwenye magunia.
Yabisi: 12-14%.
Omba ushauri zaidi:
0722 000 360
AgriSync 360"""
        }
        
        return harvest_map.get(crop, cls._error_response("Ushauri wa mavuno haujapatikana."))
    
    @classmethod
    def _market_menu(cls, parts):
        """Market prices menu handlers"""
        if len(parts) == 1:
            return """CON Bei za Soko
Chagua zao:
1. Mahindi
2. Maharagwe  
3. Viazi
4. Nyanya
5. Chai
0. Rudi Nyuma"""
        
        elif len(parts) == 2:
            crop_num = parts[1]
            if crop_num in cls.CROP_MAP:
                crop = cls.CROP_MAP[crop_num]
                return cls._crop_prices(crop)
            else:
                return cls._market_menu(['3'])
        elif parts[1] == '0':
            return cls._main_menu()
        else:
            return cls._market_menu(['3'])
    
    @classmethod
    def _crop_prices(cls, crop):
        """Get market prices for specific crop"""
        try:
            # Get current prices
            prices = MarketService.get_current_prices(crop_name=crop)
            
            if not prices:
                return cls._error_response("Bei hazipatikani kwa mazao haya.")
            
            # Get prices from major counties
            county_prices = {}
            for price_data in prices:
                county = price_data.get('county', 'Unknown')
                price = price_data.get('price_per_kg', 0)
                county_prices[county] = price
            
            # Format response with major counties
            crop_name = cls.CROP_SWAHILI.get(crop, crop.title())
            response_parts = [f"END Bei za {crop_name}:"]
            
            major_counties = ['Nairobi', 'Nakuru', 'Meru', 'Kisumu', 'Mombasa']
            for county in major_counties:
                price = county_prices.get(county, 'N/A')
                response_parts.append(f"{county}: KSH {price}/kg")
            
            response_parts.append("Taarifa: Leo")
            response_parts.append("AgriSync 360")
            
            return "\n".join(response_parts)
            
        except Exception as e:
            logger.error(f"USSD market prices error: {str(e)}")
            return cls._error_response("Samahani, kuna tatizo la bei. Jaribu tena.")
    
    @classmethod
    def _account_menu(cls, parts, phone_number):
        """Account menu handlers"""
        if len(parts) == 1:
            farmer = cls._get_farmer_by_phone(phone_number)
            if not farmer:
                return """CON Hujasajiliwa bado.
1. Sajili (Register)
0. Rudi Nyuma"""
            else:
                # Get subscription info
                try:
                    sub = MpesaService.check_subscription_status(farmer.id)
                    plan = sub.get('plan', 'free')
                    days_remaining = sub.get('days_remaining', 0)
                    
                    return f"""CON Akaunti - {farmer.first_name}
Kaunti: {farmer.county}
Usajili: {plan} - {days_remaining} siku
1. Taarifa ya Shamba (Farm Info)
2. Mazao Yangu (My Crops)
3. Badilisha Nywila (Reset Password)
0. Rudi Nyuma"""
                except:
                    return f"""CON Akaunti - {farmer.first_name}
Kaunti: {farmer.county}
1. Taarifa ya Shamba
2. Mazao Yangu
3. Badilisha Nywila
0. Rudi Nyuma"""
        
        elif len(parts) == 2:
            action = parts[1]
            if action == '1':
                return cls._farm_info(phone_number)
            elif action == '2':
                return cls._my_crops(phone_number)
            elif action == '3':
                return cls._password_reset(phone_number)
            elif action == '0':
                return cls._main_menu()
            else:
                return cls._account_menu(['4'], phone_number)
        else:
            return cls._account_menu(['4'], phone_number)
    
    @classmethod
    def _farm_info(cls, phone_number):
        """Show farmer's farm information"""
        farmer = cls._get_farmer_by_phone(phone_number)
        if not farmer:
            return cls._error_response("Akaunti haipatikani.")
        
        farms_count = len(farmer.farms) if farmer.farms else 0
        crops_count = sum(len(farm.crops) for farm in (farmer.farms or []))
        
        response = f"""END Taarifa ya Shamba:
Mashamba: {farms_count}
Mazao: {crops_count}
Kaunti: {farmer.county}
AgriSync 360"""
        
        return response
    
    @classmethod
    def _my_crops(cls, phone_number):
        """Show farmer's crops"""
        farmer = cls._get_farmer_by_phone(phone_number)
        if not farmer:
            return cls._error_response("Akaunti haipatikani.")
        
        crops_info = []
        if farmer.farms:
            for farm in farmer.farms:
                if farm.crops:
                    for crop in farm.crops:
                        if crop.is_active:
                            crop_name = cls.CROP_SWAHILI.get(crop.crop_name, crop.crop_name.title())
                            stage = crop.growth_stage.replace('_', ' ').title()
                            crops_info.append(f"{crop_name}: {stage}")
        
        if not crops_info:
            return "END Hamuna mazao yaliyopandwa.\nAgriSync 360"
        
        response = "END Mazao Yangu:\n" + "\n".join(crops_info[:3])  # Limit to 3 crops
        response += "\nAgriSync 360"
        
        return response
    
    @classmethod
    def _password_reset(cls, phone_number):
        """Initiate password reset via SMS"""
        try:
            from app.models.user import User
            user = User.query.filter_by(phone=SMSService.normalize_phone(phone_number)).first()
            
            if not user:
                # Don't reveal if user exists
                return "END Ikiwa akaunti yako ipo, utapata namba ya uthibitisho.\nAgriSync 360"
            
            # Generate OTP
            otp = user.generate_otp()
            user.otp_type = 'password_reset'
            from app.extensions import db
            db.session.commit()
            
            # Send SMS
            message = f"Your AgriSync 360 password reset code is: {otp}\nValid for 10 minutes. If you did not request this ignore this message. AgriSync 360"
            SMSService.send_sms(phone_number, message, 'password_reset', user.id)
            
            return "END Unabadilisha nywila.\nNamba ya uthibitisho imetumwa \nkwa simu yako.\nIngiza katika programu.\nAgriSync 360"
            
        except Exception as e:
            logger.error(f"USSD password reset error: {str(e)}")
            return cls._error_response("Samahani, kuna tatizo. Jaribu tena.")
    
    @classmethod
    def _subscribe_menu(cls, parts, phone_number):
        """Subscription menu handlers"""
        if len(parts) == 1:
            return """CON Jiunge na AgriSync 360
1. Msingi - KSH 99/mwezi
   (Hali ya hewa + Ushauri)
2. Pro - KSH 299/mwezi
   (Yote + Bei za soko + SMS)
0. Rudi Nyuma"""
        
        elif len(parts) == 2:
            plan = parts[1]
            if plan == '1':
                return cls._subscribe_basic(phone_number)
            elif plan == '2':
                return cls._subscribe_pro(phone_number)
            elif plan == '0':
                return cls._main_menu()
            else:
                return cls._subscribe_menu(['5'], phone_number)
        else:
            return cls._subscribe_menu(['5'], phone_number)
    
    @classmethod
    def _subscribe_basic(cls, phone_number):
        """Handle basic subscription"""
        farmer = cls._get_farmer_by_phone(phone_number)
        if not farmer:
            return cls._error_response("Sajili kwanza.")
        
        # Get last 6 digits of phone
        phone_last6 = phone_number[-6:] if len(phone_number) >= 6 else phone_number
        
        response = f"""END Unajiunga na Mpango Msingi
KSH 99/mwezi
Lipa kupitia M-Pesa:
Paybill: 174379
Akaunti: AGRI{phone_last6}
Au tunatuma ombi la malipo.
Asante! AgriSync 360"""
        
        # Trigger STK push in background
        try:
            MpesaService.initiate_stk_push(
                phone_number=phone_number,
                amount=99,
                account_reference=f"AGRI{phone_last6}",
                transaction_desc="AgriSync Basic Subscription"
            )
        except Exception as e:
            logger.error(f"USSD basic subscription STK error: {str(e)}")
        
        return response
    
    @classmethod
    def _subscribe_pro(cls, phone_number):
        """Handle pro subscription"""
        farmer = cls._get_farmer_by_phone(phone_number)
        if not farmer:
            return cls._error_response("Sajili kwanza.")
        
        # Get last 6 digits of phone
        phone_last6 = phone_number[-6:] if len(phone_number) >= 6 else phone_number
        
        response = f"""END Unajiunga na Mpango Pro
KSH 299/mwezi  
Lipa kupitia M-Pesa:
Paybill: 174379
Akaunti: AGRI{phone_last6}
Au tunatuma ombi la malipo.
Asante! AgriSync 360"""
        
        # Trigger STK push in background
        try:
            MpesaService.initiate_stk_push(
                phone_number=phone_number,
                amount=299,
                account_reference=f"AGRI{phone_last6}",
                transaction_desc="AgriSync Pro Subscription"
            )
        except Exception as e:
            logger.error(f"USSD pro subscription STK error: {str(e)}")
        
        return response
    
    @classmethod
    def _get_farmer_by_phone(cls, phone_number):
        """Get farmer by phone number"""
        try:
            normalized_phone = SMSService.normalize_phone(phone_number)
            user = User.query.filter_by(phone=normalized_phone).first()
            if user:
                return Farmer.query.filter_by(user_id=user.id).first()
            return None
        except Exception as e:
            logger.error(f"Error getting farmer by phone: {str(e)}")
            return None
    
    @classmethod
    def _error_response(cls, message):
        """Return formatted error response"""
        return f"END {message}\nAgriSync 360"
    
    @classmethod
    def get_session_data(cls, session_id):
        """Get USSD session data from Redis"""
        try:
            data = redis_client.get(f"ussd:{session_id}")
            if data:
                return json.loads(data)
            return {}
        except Exception as e:
            logger.error(f"Error getting USSD session data: {str(e)}")
            return {}
    
    @classmethod  
    def set_session_data(cls, session_id, data):
        """Set USSD session data in Redis"""
        try:
            # USSD sessions timeout after 3 minutes
            redis_client.setex(
                f"ussd:{session_id}", 
                180, 
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Error setting USSD session data: {str(e)}")
    
    @classmethod
    def clear_session(cls, session_id):
        """Clear USSD session data from Redis"""
        try:
            redis_client.delete(f"ussd:{session_id}")
        except Exception as e:
            logger.error(f"Error clearing USSD session: {str(e)}")
