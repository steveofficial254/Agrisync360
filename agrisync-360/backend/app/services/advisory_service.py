from datetime import timedelta, date
from app.models.advisory import Advisory
from app.extensions import db
import logging

logger = logging.getLogger(__name__)

class AdvisoryService:

    @staticmethod
    def get_crop_advisory(crop_name, county=None, growth_stage=None):
        """Get relevant advisories for a specific crop"""
        try:
            query = Advisory.query.filter_by(crop_name=crop_name, is_active=True)
            
            # Filter by growth stage if specified
            if growth_stage:
                query = query.filter(
                    (Advisory.growth_stage == growth_stage) | 
                    (Advisory.growth_stage.is_(None))
                )
            
            advisories = query.order_by(Advisory.advisory_type.asc()).all()
            
            # Filter by county applicability
            filtered_advisories = []
            for advisory in advisories:
                # Skip if advisory has county restrictions and farmer's county is not included
                if advisory.counties_applicable:
                    if county and county not in advisory.counties_applicable:
                        continue
                    elif not county:
                        continue  # Skip county-specific advisories if no county provided
                
                filtered_advisories.append(advisory.to_dict())
            
            return filtered_advisories
            
        except Exception as e:
            logger.error(f"Get crop advisory error: {str(e)}")
            return []

    @staticmethod
    def get_planting_calendar(crop_name, planting_date, county=None):
        """Generate a 12-week planting calendar for a crop"""
        try:
            if not isinstance(planting_date, date):
                planting_date = date.fromisoformat(planting_date)
            
            # Crop-specific calendar templates
            calendars = {
                'maize': [
                    (1, "Land preparation", "Soil moisture test", "Well-rotted manure, DAP fertilizer"),
                    (2, "Planting", "Seed depth and spacing", "Certified hybrid seeds, DAP"),
                    (3, "Gap filling", "Germination rate", "Extra seeds, water"),
                    (4, "First weeding", "Weed competition", "Hoes, herbicide"),
                    (5, "First top dressing", "Yellowing leaves", "CAN fertilizer"),
                    (6, "Pest scouting", "Armyworm signs", "Pesticides, traps"),
                    (7, "Second weeding", "Weed pressure", "Hoes, selective herbicide"),
                    (8, "Second top dressing", "Growth rate", "Urea/CAN"),
                    (9, "Disease monitoring", "Leaf spots", "Fungicides"),
                    (10, "Harvest preparation", "Dry husks", "Storage bags, drying area"),
                    (11, "Harvesting", "Mature grains", "Harvesting tools"),
                    (12, "Post-harvest", "Storage pests", "Pest control, proper storage")
                ],
                'beans': [
                    (1, "Land preparation", "Soil structure", "Well-rotted manure"),
                    (2, "Planting", "Seed treatment", "Rhizobium inoculant, DAP"),
                    (3, "Germination check", "Emergence rate", "Water if needed"),
                    (4, "First weeding", "Early weed growth", "Light hoes"),
                    (5, "Trellis setup", "Climbing varieties", "Stakes, strings"),
                    (6, "Flowering stage", "Flower drop", "Boron supplement"),
                    (7, "Pest monitoring", "Bean flies", "Appropriate pesticides"),
                    (8, "Pod development", "Pod formation", "Potassium fertilizer"),
                    (9, "Disease check", "Leaf spots", "Copper fungicide"),
                    (10, "Harvest readiness", "Pod maturity", "Harvesting baskets"),
                    (11, "Harvesting", "Dry pods", "Secateurs, baskets"),
                    (12, "Seed selection", "Quality seeds", "Storage containers")
                ],
                'tomatoes': [
                    (1, "Nursery preparation", "Seedbed quality", "Sterile soil, manure"),
                    (2, "Seed sowing", "Germination", "Quality seeds, shade"),
                    (3, "Seedling care", "Growth rate", "Water, seedling fertilizer"),
                    (4, "Transplanting", "Seedling strength", "Manure, DAP"),
                    (5, "Staking", "Plant support", "Bamboo stakes, strings"),
                    (6, "First pruning", "Suckers", "Pruning tools"),
                    (7, "First flowering", "Flower set", "Boron, calcium"),
                    (8, "Fruit set", "Fruit development", "Balanced NPK"),
                    (9, "Disease monitoring", "Leaf symptoms", "Preventive fungicides"),
                    (10, "Second pruning", "Lower leaves", "Clean tools"),
                    (11, "Harvesting", "Fruit color", "Harvesting baskets"),
                    (12, "Post-harvest", "Storage", "Cool storage, packaging")
                ],
                'potatoes': [
                    (1, "Seed preparation", "Seed quality", "Certified seed tubers"),
                    (2, "Land preparation", "Soil tilth", "Deep plowing, manure"),
                    (3, "Planting", "Tuber placement", "Planting tools, fertilizer"),
                    (4, "Emergence", "Shoot growth", "Water monitoring"),
                    (5, "First earthing up", "Soil coverage", "Hoes"),
                    (6, "Pest scouting", "Tuber moths", "Pesticides, traps"),
                    (7, "Second earthing up", "Hill formation", "Hoes, ridgers"),
                    (8, "Disease monitoring", "Late blight signs", "Fungicides"),
                    (9, "Tuber development", "Bulking", "Potassium fertilizer"),
                    (10, "Haulm cutting", "Plant maturity", "Cutting tools"),
                    (11, "Harvesting", "Tuber maturity", "Forks, baskets"),
                    (12, "Curing", "Storage prep", "Curing area, ventilation")
                ]
            }
            
            # Get calendar for crop or use generic template
            calendar_template = calendars.get(crop_name, calendars['maize'])
            
            calendar = []
            for week, task, watch_for, inputs in calendar_template:
                calendar_date = planting_date + timedelta(days=(week - 1) * 7)
                
                # Add county-specific advice if available
                county_note = ""
                if county:
                    county_advisory = Advisory.query.filter_by(
                        crop_name=crop_name,
                        advisory_type="general",
                        growth_stage=None,
                        is_active=True
                    ).filter(
                        Advisory.counties_applicable.contains([county])
                    ).first()
                    
                    if county_advisory:
                        county_note = f" ({county} specific: {county_advisory.title})"
                
                calendar.append({
                    "week": week,
                    "date": calendar_date.isoformat(),
                    "crop_name": crop_name,
                    "task": task + county_note,
                    "watch_for": watch_for,
                    "inputs_needed": inputs,
                    "estimated_days_from_planting": (week - 1) * 7
                })
            
            return calendar
            
        except Exception as e:
            logger.error(f"Get planting calendar error: {str(e)}")
            return []

    @staticmethod
    def get_disease_alert(crop_name, weather_risk="medium", county=None):
        """Get disease alerts based on weather risk and crop"""
        try:
            if weather_risk not in ["high", "very_high"]:
                return []
            
            # Get disease-specific advisories
            disease_advisories = Advisory.query.filter_by(
                crop_name=crop_name,
                advisory_type="disease_alert",
                is_active=True
            ).all()
            
            alerts = []
            for advisory in disease_advisories:
                # Check county applicability
                if advisory.counties_applicable:
                    if county and county not in advisory.counties_applicable:
                        continue
                    elif not county:
                        continue
                
                alerts.append({
                    "crop_name": crop_name,
                    "risk_level": weather_risk,
                    "threat": advisory.title,
                    "action_required": advisory.content,
                    "priority": "high" if weather_risk == "very_high" else "medium",
                    "county_specific": county in advisory.counties_applicable if advisory.counties_applicable else False
                })
            
            # If no specific advisories, provide general alerts
            if not alerts:
                general_alerts = {
                    'maize': {
                        'threat': 'Maize Lethal Necrosis Disease',
                        'action': 'Monitor for mosaic patterns, use resistant varieties, control insect vectors'
                    },
                    'tomatoes': {
                        'threat': 'Early and Late Blight',
                        'action': 'Apply preventive fungicides, ensure good drainage, remove infected plants'
                    },
                    'potatoes': {
                        'threat': 'Late Blight',
                        'action': 'Apply preventive fungicides, avoid overhead irrigation, monitor weather'
                    },
                    'beans': {
                        'threat': 'Angular Leaf Spot',
                        'action': 'Apply copper fungicides, ensure proper spacing, use certified seeds'
                    }
                }
                
                if crop_name in general_alerts:
                    alerts.append({
                        "crop_name": crop_name,
                        "risk_level": weather_risk,
                        "threat": general_alerts[crop_name]['threat'],
                        "action_required": general_alerts[crop_name]['action'],
                        "priority": "high" if weather_risk == "very_high" else "medium",
                        "county_specific": False
                    })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Get disease alert error: {str(e)}")
            return []

    @staticmethod
    def get_nutrition_guide(crop_name, growth_stage=None):
        """Get nutrition guide for specific crop and growth stage"""
        try:
            # Crop-specific NPK requirements by growth stage
            nutrition_requirements = {
                'maize': {
                    'land_prep': {'N': 0, 'P': 40, 'K': 0, 'description': 'Apply DAP or MAP at planting'},
                    'planting': {'N': 0, 'P': 40, 'K': 0, 'description': 'Base fertilizer at planting'},
                    'germination': {'N': 10, 'P': 20, 'K': 10, 'description': 'Starter fertilizer'},
                    'vegetative': {'N': 60, 'P': 20, 'K': 30, 'description': 'Top dressing with CAN/Urea'},
                    'flowering': {'N': 30, 'P': 30, 'K': 40, 'description': 'Balanced application'},
                    'maturity': {'N': 10, 'P': 10, 'K': 20, 'description': 'Final top dressing'}
                },
                'beans': {
                    'land_prep': {'N': 0, 'P': 30, 'K': 20, 'description': 'Apply DAP with rhizobium'},
                    'planting': {'N': 0, 'P': 30, 'K': 20, 'description': 'Base fertilizer at planting'},
                    'germination': {'N': 5, 'P': 15, 'K': 10, 'description': 'Light application'},
                    'vegetative': {'N': 20, 'P': 15, 'K': 25, 'description': 'Balanced fertilizer'},
                    'flowering': {'N': 15, 'P': 20, 'K': 30, 'description': 'Focus on potassium'},
                    'maturity': {'N': 5, 'P': 10, 'K': 15, 'description': 'Pod development'}
                },
                'tomatoes': {
                    'land_prep': {'N': 20, 'P': 40, 'K': 20, 'description': 'Well-rotted manure + DAP'},
                    'planting': {'N': 20, 'P': 40, 'K': 20, 'description': 'Base fertilizer in planting holes'},
                    'germination': {'N': 15, 'P': 20, 'K': 15, 'description': 'Starter solution'},
                    'vegetative': {'N': 40, 'P': 20, 'K': 30, 'description': 'Growth fertilizer'},
                    'flowering': {'N': 30, 'P': 30, 'K': 40, 'description': 'Flowering fertilizer'},
                    'maturity': {'N': 20, 'P': 20, 'K': 30, 'description': 'Fruit development'}
                },
                'potatoes': {
                    'land_prep': {'N': 30, 'P': 50, 'K': 40, 'description': 'High P and K for tuber development'},
                    'planting': {'N': 30, 'P': 50, 'K': 40, 'description': 'Complete fertilizer at planting'},
                    'germination': {'N': 20, 'P': 20, 'K': 30, 'description': 'Early growth'},
                    'vegetative': {'N': 50, 'P': 20, 'K': 50, 'description': 'Top dressing for foliage'},
                    'flowering': {'N': 30, 'P': 20, 'K': 60, 'description': 'Focus on potassium for tubers'},
                    'maturity': {'N': 20, 'P': 10, 'K': 40, 'description': 'Tuber bulking'}
                }
            }
            
            # Get requirements for crop
            crop_requirements = nutrition_requirements.get(crop_name, nutrition_requirements['maize'])
            
            # Get specific stage or use vegetative as default
            stage = growth_stage or 'vegetative'
            npk_requirements = crop_requirements.get(stage, crop_requirements['vegetative'])
            
            # Recommended products based on NPK ratio
            def recommend_products(n, p, k):
                products = []
                if p > 30:
                    products.append("DAP (18:46:0)")
                if n > 40:
                    products.append("Urea (46:0:0)")
                if n > 20 and p > 10 and k > 10:
                    products.append("NPK 17:17:17")
                if k > 30:
                    products.append("Muriate of Potash (0:0:60)")
                if n > 20 and p < 20:
                    products.append("CAN (26:0:0)")
                if not products:
                    products.append("NPK 23:23:0")
                return products
            
            return {
                "crop_name": crop_name,
                "growth_stage": stage,
                "npk_requirements": npk_requirements,
                "recommended_products": recommend_products(
                    npk_requirements['N'],
                    npk_requirements['P'],
                    npk_requirements['K']
                ),
                "application_method": npk_requirements['description'],
                "application_timing": f"Apply during {stage} stage"
            }
            
        except Exception as e:
            logger.error(f"Get nutrition guide error: {str(e)}")
            return {"error": "Failed to generate nutrition guide"}
