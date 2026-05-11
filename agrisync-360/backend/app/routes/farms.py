from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import logging

from app.extensions import db, limiter
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.farmer import Farmer
from app.services.weather_service import WeatherService
# from app.services.geocoding_service import GeocodingService  # Temporarily disabled

farms_bp = Blueprint("farms", __name__, url_prefix="/api/farms")


def err(error="error", message="Request failed", status=400, details=None):
    body = {"success": False, "error": error, "message": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status

logger = logging.getLogger(__name__)

# Health check endpoint (no JWT required for debugging)
@farms_bp.get("/health")
def farms_health():
    return jsonify({
        "success": True,
        "message": "Farms blueprint is working",
        "routes": [
            "GET /api/farms/health",
            "POST /api/farms/",
            "GET /api/farms/",
            "GET /api/farms/<id>",
            "PUT /api/farms/<id>",
            "DELETE /api/farms/<id>"
        ]
    })

# Debug endpoint to test create_farm without JWT (temporary)
@farms_bp.post("/debug-create")
def debug_create_farm():
    try:
        return jsonify({
            "success": True,
            "message": "Debug create endpoint is working",
            "request_data": "Endpoint is accessible"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Valid soil types and water sources
SOIL_TYPES = ["clay", "loam", "sandy", "silt", "peat"]
WATER_SOURCES = ["rain", "irrigation", "river", "borehole", "none"]


@farms_bp.post("/")
@jwt_required()
def create_farm():
    try:
        user_id = get_jwt_identity()
        logger.info(f"Farm creation request - User ID: {user_id}")
        
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        logger.info(f"Farmer found: {farmer is not None}")
        
        if not farmer:
            logger.warning(f"User {user_id} trying to create farm but no farmer profile exists")
            return err(
                "farmer_profile_required", 
                "You need to create a farmer profile before adding farms. Please complete your profile first.", 
                404,
                {
                    "action_required": "create_farmer_profile",
                    "redirect_to": "/api/farmers/profile",
                    "message": "Create your farmer profile with location and farm details first"
                }
            )
        
        payload = request.get_json() or {}
        logger.info(f"Farm creation payload received: {payload}")
        
        # Auto-generate coordinates from county/sub-county if not provided
        if "latitude" not in payload or "longitude" not in payload:
            # Temporarily use default coordinates for Nairobi
            payload["latitude"] = -1.2921
            payload["longitude"] = 36.8219
            logger.info(f"Using default Nairobi coordinates for debugging")
        
        logger.info(f"Final farm payload: {payload}")
        
        # TODO: Re-enable geocoding once import issue is fixed
        """
        county = payload.get("county")
        sub_county = payload.get("sub_county")
        
        if county:
            auto_coords = GeocodingService.get_coordinates_for_location(county, sub_county)
            if auto_coords:
                payload["latitude"], payload["longitude"] = auto_coords
                logger.info(f"Auto-generated coordinates for {county}, {sub_county}: {auto_coords}")
            else:
                return err("validation_error", f"Unable to determine coordinates for county: {county}", 400)
        else:
            return err("validation_error", "County is required for automatic location detection", 400)
        """
        
        # Validate required fields
        required_fields = ["name", "latitude", "longitude", "county", "size_acres", "soil_type", "water_source"]
        logger.info(f"Validating required fields: {required_fields}")
        
        for field in required_fields:
            if field not in payload:
                logger.error(f"Missing required field: {field}")
                return err("validation_error", f"Missing required field: {field}", 400)
            logger.info(f"Field {field} present: {payload[field]}")
        
        logger.info("All required fields present")
        
        # Validate coordinates
        try:
            logger.info(f"Validating coordinates: lat={payload['latitude']}, lon={payload['longitude']}")
            lat = float(payload["latitude"])
            lon = float(payload["longitude"])
            logger.info(f"Parsed coordinates: lat={lat}, lon={lon}")
            
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                logger.error(f"Coordinates out of range: lat={lat}, lon={lon}")
                return err("validation_error", "Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180", 400)
            
            logger.info("Coordinates are in valid range")
            
            # Validate coordinates are within Kenya (temporarily disabled)
            # if not GeocodingService.validate_coordinates(lat, lon):
            #     return err("validation_error", "Coordinates appear to be outside Kenya. Please check your location.", 400)
                
        except (ValueError, TypeError) as e:
            logger.error(f"Coordinate validation error: {e}")
            return err("validation_error", "Invalid coordinate format", 400)
        
        # Validate size
        try:
            logger.info(f"Validating size: {payload['size_acres']}")
            size_acres = float(payload["size_acres"])
            logger.info(f"Parsed size: {size_acres}")
            
            if not (0 < size_acres < 10000):
                logger.error(f"Size out of range: {size_acres}")
                return err("validation_error", "Farm size must be between 0 and 10000 acres", 400)
            
            logger.info("Size validation passed")
        except (ValueError, TypeError) as e:
            logger.error(f"Size validation error: {e}")
            return err("validation_error", "Invalid size format", 400)
        
        # Validate enums
        logger.info(f"Validating soil type: {payload.get('soil_type')} (allowed: {SOIL_TYPES})")
        if payload.get("soil_type") not in SOIL_TYPES:
            logger.error(f"Invalid soil type: {payload.get('soil_type')}")
            return err("validation_error", f"Invalid soil type. Must be one of: {', '.join(SOIL_TYPES)}", 400)
        
        logger.info(f"Validating water source: {payload.get('water_source')} (allowed: {WATER_SOURCES})")
        if payload.get("water_source") not in WATER_SOURCES:
            logger.error(f"Invalid water source: {payload.get('water_source')}")
            return err("validation_error", f"Invalid water source. Must be one of: {', '.join(WATER_SOURCES)}", 400)
        
        logger.info("Soil type and water source validation passed")
        
        # Validate county
        from app.routes.farmers import KENYAN_COUNTIES
        logger.info(f"Validating county: {payload.get('county')} (allowed sample: {KENYAN_COUNTIES[:5]})")
        
        # Check case-insensitive county validation
        county = payload.get("county")
        if county not in KENYAN_COUNTIES:
            # Try case-insensitive match
            county_lower = county.lower()
            matching_counties = [c for c in KENYAN_COUNTIES if c.lower() == county_lower]
            
            if matching_counties:
                logger.info(f"Found case-insensitive match: {county} -> {matching_counties[0]}")
                payload["county"] = matching_counties[0]  # Fix the case
            else:
                logger.error(f"Invalid county: {county}")
                return err("validation_error", f"Invalid Kenyan county: {county}. Must be one of: {', '.join(KENYAN_COUNTIES[:10])}...", 400)
        
        logger.info("County validation passed")
        logger.info("All validations passed - creating farm...")
        
        # Check if this is the first farm
        existing_farms_count = farmer.farms.filter_by(is_deleted=False).count()
        is_primary = existing_farms_count == 0
        logger.info(f"Existing farms count: {existing_farms_count}, is_primary: {is_primary}")
        
        farm = Farm(
            farmer_id=farmer.id,
            name=payload["name"],
            location=Farm.build_point(lat, lon),
            county=payload["county"],
            sub_county=payload.get("sub_county"),
            size_acres=size_acres,
            soil_type=payload["soil_type"],
            water_source=payload["water_source"],
            elevation_meters=payload.get("elevation_meters"),
            is_primary=is_primary
        )
        
        db.session.add(farm)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": farm.to_dict(),
            "message": "Farm created successfully"
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        logger.error(f"Farm creation integrity error: {str(e)}")
        return err("conflict", "Farm with this data already exists", 409)
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Farm creation DB error: {str(e)}")
        return err("server_error", "Database error. Please try again.", 500)
    except Exception as e:
        logger.error(f"Farm creation error: {str(e)}")
        return err("server_error", "Failed to create farm", 500)


@farms_bp.get("/")
@limiter.limit("1000 per hour")  # Generous limit for farm data
@jwt_required()
def list_farms():
    try:
        user_id = get_jwt_identity()
        logger.info(f"Fetching farms for user_id: {user_id}")
        
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            logger.warning(f"No farmer profile found for user_id: {user_id}")
            return err("not_found", "No farmer profile found. Please create a farmer profile first.", 404)
        
        farms = farmer.farms.filter_by(is_deleted=False).all()
        farms_data = []
        
        for farm in farms:
            farm_dict = farm.to_dict()
            
            # Add crop count
            crop_count = farm.crop_subscriptions.filter_by(is_active=True).count()
            farm_dict["crop_count"] = crop_count
            
            # Add weather summary for farm location
            lat, lon = farm.get_coordinates()
            if lat and lon:
                try:
                    weather = WeatherService.get_forecast(lat, lon)
                    if weather and weather.get("forecast"):
                        today_weather = weather["forecast"][0] if weather["forecast"] else {}
                        farm_dict["weather_summary"] = {
                            "temp_max": today_weather.get("temp_max"),
                            "temp_min": today_weather.get("temp_min"),
                            "precipitation_mm": today_weather.get("precipitation_mm"),
                            "disease_risk": today_weather.get("disease_risk"),
                            "weather_description": today_weather.get("weather_description")
                        }
                except Exception as weather_err:
                    logger.warning(f"Failed to get weather for farm {farm.id}: {weather_err}")
                    farm_dict["weather_summary"] = None
            else:
                farm_dict["weather_summary"] = None
            
            farms_data.append(farm_dict)
        
        return jsonify({
            "success": True,
            "data": farms_data,
            "message": "Farms retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"List farms error: {str(e)}")
        return err("server_error", "Failed to retrieve farms", 500)


@farms_bp.get("/<farm_id>")
@jwt_required()
def get_farm(farm_id):
    try:
        user_id = get_jwt_identity()
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        farm = Farm.query.filter_by(id=farm_id, farmer_id=farmer.id, is_deleted=False).first()
        if not farm:
            return err("not_found", "Farm not found", 404)
        
        farm_dict = farm.to_dict()
        
        # Add active crops with growth stages
        active_crops = []
        for crop in farm.crop_subscriptions.filter_by(is_active=True):
            crop_data = crop.to_dict()
            
            # Auto-update growth stage based on days since planting
            crop_data["growth_stage"] = crop.get_current_growth_stage()
            
            active_crops.append(crop_data)
        
        farm_dict["active_crops"] = active_crops
        
        # Add weather forecast for farm location
        lat, lon = farm.get_coordinates()
        if lat and lon:
            try:
                weather = WeatherService.get_forecast(lat, lon)
                if weather:
                    farm_dict["weather_forecast"] = weather
                else:
                    farm_dict["weather_forecast"] = None
            except Exception as weather_err:
                logger.warning(f"Failed to get weather for farm {farm.id}: {weather_err}")
                farm_dict["weather_forecast"] = None
        else:
            farm_dict["weather_forecast"] = None
        
        return jsonify({
            "success": True,
            "data": farm_dict,
            "message": "Farm retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Get farm error: {str(e)}")
        return err("server_error", "Failed to retrieve farm", 500)


@farms_bp.put("/<farm_id>")
@jwt_required()
def update_farm(farm_id):
    try:
        user_id = get_jwt_identity()
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        farm = Farm.query.filter_by(id=farm_id, farmer_id=farmer.id, is_deleted=False).first()
        if not farm:
            return err("not_found", "Farm not found", 404)
        
        payload = request.get_json() or {}
        
        # Validate coordinates if provided
        if "latitude" in payload and "longitude" in payload:
            try:
                lat = float(payload["latitude"])
                lon = float(payload["longitude"])
                if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                    return err("validation_error", "Invalid coordinates", 400)
                farm.location = Farm.build_point(lat, lon)
            except (ValueError, TypeError):
                return err("validation_error", "Invalid coordinate format", 400)
        
        # Validate size if provided
        if "size_acres" in payload:
            try:
                size_acres = float(payload["size_acres"])
                if not (0 < size_acres < 10000):
                    return err("validation_error", "Farm size must be between 0 and 10000 acres", 400)
                farm.size_acres = size_acres
            except (ValueError, TypeError):
                return err("validation_error", "Invalid size format", 400)
        
        # Validate enums if provided
        if "soil_type" in payload:
            if payload["soil_type"] not in SOIL_TYPES:
                return err("validation_error", f"Invalid soil type. Must be one of: {', '.join(SOIL_TYPES)}", 400)
            farm.soil_type = payload["soil_type"]
        
        if "water_source" in payload:
            if payload["water_source"] not in WATER_SOURCES:
                return err("validation_error", f"Invalid water source. Must be one of: {', '.join(WATER_SOURCES)}", 400)
            farm.water_source = payload["water_source"]
        
        # Validate county if provided
        if "county" in payload:
            from app.routes.farmers import KENYAN_COUNTIES
            if payload["county"] not in KENYAN_COUNTIES:
                return err("validation_error", "Invalid Kenyan county", 400)
            farm.county = payload["county"]
        
        # Update allowed fields (excluding is_primary)
        updatable_fields = ["name", "county", "sub_county", "elevation_meters"]
        for field in updatable_fields:
            if field in payload:
                setattr(farm, field, payload[field])
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": farm.to_dict(),
            "message": "Farm updated successfully"
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Farm update error: {str(e)}")
        return err("server_error", "Failed to update farm", 500)
    except Exception as e:
        logger.error(f"Farm update error: {str(e)}")
        return err("server_error", "Failed to update farm", 500)


@farms_bp.delete("/<farm_id>")
@jwt_required()
def delete_farm(farm_id):
    try:
        user_id = get_jwt_identity()
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        farm = Farm.query.filter_by(id=farm_id, farmer_id=farmer.id, is_deleted=False).first()
        if not farm:
            return err("not_found", "Farm not found", 404)
        
        # Cannot delete primary farm if other farms exist
        if farm.is_primary:
            other_farms_count = farmer.farms.filter_by(is_deleted=False).filter(Farm.id != farm_id).count()
            if other_farms_count > 0:
                return err("validation_error", "Cannot delete primary farm while other farms exist. Set another farm as primary first.", 400)
        
        # Soft delete
        farm.is_deleted = True
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": {},
            "message": "Farm deleted successfully"
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Farm deletion error: {str(e)}")
        return err("server_error", "Failed to delete farm", 500)
    except Exception as e:
        logger.error(f"Farm deletion error: {str(e)}")
        return err("server_error", "Failed to delete farm", 500)


@farms_bp.post("/<farm_id>/set-primary")
@jwt_required()
def set_primary_farm(farm_id):
    try:
        user_id = get_jwt_identity()
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        farm = Farm.query.filter_by(id=farm_id, farmer_id=farmer.id, is_deleted=False).first()
        if not farm:
            return err("not_found", "Farm not found", 404)
        
        # Unset previous primary farm
        previous_primary = farmer.farms.filter_by(is_primary=True, is_deleted=False).first()
        if previous_primary:
            previous_primary.is_primary = False
        
        # Set new primary farm
        farm.is_primary = True
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": farm.to_dict(),
            "message": "Primary farm set successfully"
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Set primary farm error: {str(e)}")
        return err("server_error", "Failed to set primary farm", 500)
    except Exception as e:
        logger.error(f"Set primary farm error: {str(e)}")
        return err("server_error", "Failed to set primary farm", 500)


@farms_bp.post("/<farm_id>/crops")
@jwt_required()
def add_crop(farm_id):
    try:
        user_id = get_jwt_identity()
        logger.info(f"Crop creation request - User ID: {user_id}, Farm ID: {farm_id}")
        
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        # Verify farm ownership
        farm = Farm.query.filter_by(id=farm_id, farmer_id=farmer.id, is_deleted=False).first()
        if not farm:
            return err("not_found", "Farm not found", 404)
        
        payload = request.get_json() or {}
        logger.info(f"Crop creation payload: {payload}")
        
        # Validate required fields
        required_fields = ["crop_name", "planting_date", "area_planted_acres"]
        for field in required_fields:
            if field not in payload:
                return err("validation_error", f"Missing required field: {field}", 400)
        
        # Validate crop name
        valid_crops = ["maize", "beans", "potatoes", "tomatoes", "tea", "wheat", "rice", "cassava", "sorghum", "cabbage", "kale", "onions", "other"]
        if payload["crop_name"] not in valid_crops:
            return err("validation_error", f"Invalid crop name. Must be one of: {', '.join(valid_crops)}", 400)
        
        # Validate planting date
        try:
            from datetime import datetime
            planting_date = datetime.strptime(payload["planting_date"], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return err("validation_error", "Invalid planting date format. Use YYYY-MM-DD", 400)
        
        # Validate area
        try:
            area_planted = float(payload["area_planted_acres"])
            if not (0 < area_planted <= farm.size_acres):
                return err("validation_error", f"Area planted must be between 0 and {farm.size_acres} acres", 400)
        except (ValueError, TypeError):
            return err("validation_error", "Invalid area format", 400)
        
        # Auto-calculate expected harvest date if not provided
        expected_harvest_date = None
        if "expected_harvest_date" in payload:
            try:
                expected_harvest_date = datetime.strptime(payload["expected_harvest_date"], "%Y-%m-%d").date()
            except (ValueError, TypeError):
                return err("validation_error", "Invalid expected harvest date format. Use YYYY-MM-DD", 400)
        else:
            # Auto-calculate based on crop
            harvest_days = {
                "maize": 90, "beans": 75, "potatoes": 90,
                "tomatoes": 80, "tea": None, "wheat": 120,
                "cabbage": 90, "kale": 60, "onions": 150,
                "cassava": 270, "sorghum": 120, "rice": 120
            }
            days = harvest_days.get(payload["crop_name"], 90)
            if days:
                from datetime import timedelta
                expected_harvest_date = planting_date + timedelta(days=days)
        
        # Auto-set growth stage based on days since planting
        from datetime import date
        days_since = (date.today() - planting_date).days
        if days_since <= 7:
            growth_stage = "germination"
        elif days_since <= 45:
            growth_stage = "vegetative"
        elif days_since <= 60:
            growth_stage = "flowering"
        elif days_since <= 80:
            growth_stage = "fruiting"
        elif days_since <= 120:
            growth_stage = "maturity"
        else:
            growth_stage = "harvested"
        
        crop = Crop(
            farm_id=farm_id,
            crop_name=payload["crop_name"],
            variety=payload.get("variety"),
            planting_date=planting_date,
            expected_harvest_date=expected_harvest_date,
            area_planted_acres=area_planted,
            growth_stage=growth_stage
        )
        
        db.session.add(crop)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": crop.to_dict(),
            "message": "Crop added successfully"
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        logger.error(f"Crop creation integrity error: {str(e)}")
        return err("conflict", "Crop with this data already exists", 409)
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Crop creation DB error: {str(e)}")
        return err("server_error", "Database error. Please try again.", 500)
    except Exception as e:
        logger.error(f"Crop creation error: {str(e)}")
        return err("server_error", "Failed to add crop", 500)


@farms_bp.get("/<farm_id>/crops")
@limiter.limit("2000 per hour")
@jwt_required()
def list_crops(farm_id):
    try:
        user_id = get_jwt_identity()
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        # Verify farm ownership
        farm = Farm.query.filter_by(id=farm_id, farmer_id=farmer.id, is_deleted=False).first()
        if not farm:
            return err("not_found", "Farm not found", 404)
        
        crops = Crop.query.filter_by(farm_id=farm_id, is_active=True).all()
        crops_data = []
        
        for crop in crops:
            crop_data = crop.to_dict()
            
            # Include days_since_planting and days_to_harvest (already in to_dict)
            # Include current growth stage (auto-updated)
            crop_data["current_growth_stage"] = crop.get_current_growth_stage()
            
            # TODO: Include latest advisory for each crop (will implement in advisory system)
            crop_data["latest_advisory"] = None
            
            crops_data.append(crop_data)
        
        return jsonify({
            "success": True,
            "data": crops_data,
            "message": "Crops retrieved successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"List crops error: {str(e)}")
        return err("server_error", "Failed to retrieve crops", 500)


@farms_bp.put("/<farm_id>/crops/<crop_id>")
@jwt_required()
def update_crop(farm_id, crop_id):
    try:
        user_id = get_jwt_identity()
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        # Verify farm ownership
        farm = Farm.query.filter_by(id=farm_id, farmer_id=farmer.id, is_deleted=False).first()
        if not farm:
            return err("not_found", "Farm not found", 404)
        
        crop = Crop.query.filter_by(id=crop_id, farm_id=farm_id, is_active=True).first()
        if not crop:
            return err("not_found", "Crop not found", 404)
        
        payload = request.get_json() or {}
        
        # Update allowed fields
        updatable_fields = ["variety", "growth_stage", "notes"]
        for field in updatable_fields:
            if field in payload:
                setattr(crop, field, payload[field])
        
        # Validate growth_stage if provided
        if "growth_stage" in payload:
            valid_stages = ["land_prep", "planting", "germination", "vegetative", "flowering", "fruiting", "maturity", "harvested"]
            if payload["growth_stage"] not in valid_stages:
                return err("validation_error", f"Invalid growth stage. Must be one of: {', '.join(valid_stages)}", 400)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": crop.to_dict(),
            "message": "Crop updated successfully"
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Crop update error: {str(e)}")
        return err("server_error", "Failed to update crop", 500)
    except Exception as e:
        logger.error(f"Crop update error: {str(e)}")
        return err("server_error", "Failed to update crop", 500)


@farms_bp.delete("/<farm_id>/crops/<crop_id>")
@jwt_required()
def remove_crop(farm_id, crop_id):
    try:
        user_id = get_jwt_identity()
        farmer = Farmer.query.filter_by(user_id=user_id).first()
        if not farmer:
            return err("not_found", "Farmer profile not found", 404)
        
        # Verify farm ownership
        farm = Farm.query.filter_by(id=farm_id, farmer_id=farmer.id, is_deleted=False).first()
        if not farm:
            return err("not_found", "Farm not found", 404)
        
        crop = Crop.query.filter_by(id=crop_id, farm_id=farm_id, is_active=True).first()
        if not crop:
            return err("not_found", "Crop not found", 404)
        
        # Soft delete
        crop.is_active = False
        db.session.commit()
        
        return jsonify({
            "success": True,
            "data": {},
            "message": "Crop removed successfully"
        }), 200
        
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Crop removal error: {str(e)}")
        return err("server_error", "Failed to remove crop", 500)
    except Exception as e:
        logger.error(f"Crop removal error: {str(e)}")
        return err("server_error", "Failed to remove crop", 500)
