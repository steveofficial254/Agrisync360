#!/usr/bin/env python3
"""
Advisory Data Seeder for AgriSync 360
Seeds comprehensive crop advisories for testing and development.
"""

from app.extensions import db
from app.models.advisory import Advisory

def seed():
    """Seed comprehensive advisory data"""
    
    # Clear existing data
    Advisory.query.delete()
    db.session.commit()
    
    advisories = []
    
    # Maize advisories
    maize_advisories = [
        {
            "crop_name": "maize",
            "title": "Land Preparation for Maize",
            "content": "Prepare land by deep plowing to 20-30cm depth. Remove weeds and incorporate well-rotted manure at 10-15 tons per hectare. Test soil pH and lime if below 5.5. Ensure proper drainage to prevent waterlogging.",
            "advisory_type": "planting",
            "growth_stage": "land_prep",
            "season": "long_rains",
            "counties_applicable": ["Uasin Gishu", "Trans Nzoia", "Nandi", "Nakuru", "Bungoma"]
        },
        {
            "crop_name": "maize",
            "title": "Maize Planting Guidelines",
            "content": "Plant certified hybrid seeds at 25-30cm spacing between plants and 75cm between rows. Plant 2-3 seeds per hole at 3-5cm depth. Apply DAP fertilizer at planting time at 50kg per hectare. Ensure adequate soil moisture.",
            "advisory_type": "planting",
            "growth_stage": "planting",
            "season": "long_rains",
            "counties_applicable": ["Uasin Gishu", "Trans Nzoia", "Nandi", "Nakuru", "Bungoma"]
        },
        {
            "crop_name": "maize",
            "title": "Maize Top Dressing Application",
            "content": "Apply first top dressing of CAN or Urea at 3-4 weeks after emergence at 50kg per hectare. Apply second top dressing at 6-7 weeks at 30kg per hectare. Apply in split doses when soil is moist. Avoid fertilizer contact with leaves.",
            "advisory_type": "nutrition",
            "growth_stage": "vegetative",
            "season": "long_rains",
            "counties_applicable": ["Uasin Gishu", "Trans Nzoia", "Nandi", "Nakuru", "Bungoma"]
        },
        {
            "crop_name": "maize",
            "title": "Maize Pest Management",
            "content": "Scout for fall armyworm, stem borers, and cutworms weekly. Use pheromone traps for early detection. Apply appropriate pesticides when damage exceeds economic threshold. Practice crop rotation to break pest cycles.",
            "advisory_type": "pest_control",
            "growth_stage": "vegetative",
            "season": "long_rains",
            "counties_applicable": ["Uasin Gishu", "Trans Nzoia", "Nandi", "Nakuru", "Bungoma"]
        },
        {
            "crop_name": "maize",
            "title": "Maize Harvest Timing",
            "content": "Harvest when husks turn brown and dry, grains are hard and mature. Moisture content should be 15-20% at harvest. Dry further to 13% for storage. Use proper harvesting techniques to minimize losses.",
            "advisory_type": "harvest",
            "growth_stage": "maturity",
            "season": "long_rains",
            "counties_applicable": ["Uasin Gishu", "Trans Nzoia", "Nandi", "Nakuru", "Bungoma"]
        }
    ]
    
    # Beans advisories
    beans_advisories = [
        {
            "crop_name": "beans",
            "title": "Beans Land Preparation",
            "content": "Prepare fine seedbed with minimal tillage. Incorporate well-rotted manure at 5-10 tons per hectare. Ensure good drainage as beans are sensitive to waterlogging. Test soil and adjust pH to 6.0-6.8.",
            "advisory_type": "planting",
            "growth_stage": "land_prep",
            "season": "long_rains",
            "counties_applicable": ["Meru", "Embu", "Tharaka Nithi", "Kirinyaga", "Nyeri"]
        },
        {
            "crop_name": "beans",
            "title": "Beans Planting Guidelines",
            "content": "Plant certified seeds at 5-10cm depth, 10-15cm between plants, 30-40cm between rows. Apply DAP fertilizer at planting at 25kg per hectare. Inoculate seeds with rhizobium before planting. Plant early in the season.",
            "advisory_type": "planting",
            "growth_stage": "planting",
            "season": "long_rains",
            "counties_applicable": ["Meru", "Embu", "Tharaka Nithi", "Kirinyaga", "Nyeri"]
        },
        {
            "crop_name": "beans",
            "title": "Beans Disease Management",
            "content": "Watch for angular leaf spot, common bacterial blight, and bean rust. Apply copper-based fungicides preventively. Ensure good air circulation by proper spacing. Remove and destroy infected plants.",
            "advisory_type": "pest_control",
            "growth_stage": "vegetative",
            "season": "long_rains",
            "counties_applicable": ["Meru", "Embu", "Tharaka Nithi", "Kirinyaga", "Nyeri"]
        }
    ]
    
    # Tomatoes advisories
    tomato_advisories = [
        {
            "crop_name": "tomatoes",
            "title": "Tomato Nursery Establishment",
            "content": "Prepare raised seedbeds 1m wide and 15cm high. Mix soil with well-rotted manure and sand. Sow seeds thinly and cover lightly. Provide shade and water regularly. Transplant after 4-6 weeks when seedlings have 3-4 true leaves.",
            "advisory_type": "planting",
            "growth_stage": "nursery",
            "season": "all",
            "counties_applicable": ["Kiambu", "Kajiado", "Machakos", "Makueni", "Kericho"]
        },
        {
            "crop_name": "tomatoes",
            "title": "Tomato Transplanting",
            "content": "Transplant seedlings at 60cm x 60cm spacing. Apply well-rotted manure in planting holes. Water immediately after transplanting. Apply starter fertilizer (DAP) at 200kg per hectare. Mulch to conserve moisture.",
            "advisory_type": "planting",
            "growth_stage": "transplanting",
            "season": "all",
            "counties_applicable": ["Kiambu", "Kajiado", "Machakos", "Makueni", "Kericho"]
        },
        {
            "crop_name": "tomatoes",
            "title": "Tomato Pruning and Staking",
            "content": "Remove suckers below first flower cluster. Stake plants to support fruit and prevent diseases. Prune lower leaves touching the ground. Maintain single stem for better fruit quality. Use bamboo or wooden stakes.",
            "advisory_type": "general",
            "growth_stage": "vegetative",
            "season": "all",
            "counties_applicable": ["Kiambu", "Kajiado", "Machakos", "Makueni", "Kericho"]
        },
        {
            "crop_name": "tomatoes",
            "title": "Tomato Disease Alert",
            "content": "High risk of early and late blight during wet conditions. Apply preventive fungicides weekly. Ensure good drainage and air circulation. Remove infected leaves immediately. Use resistant varieties where possible.",
            "advisory_type": "disease_alert",
            "growth_stage": "vegetative",
            "season": "long_rains",
            "counties_applicable": ["Kiambu", "Kajiado", "Machakos", "Makueni", "Kericho"]
        }
    ]
    
    # Potatoes advisories
    potato_advisories = [
        {
            "crop_name": "potatoes",
            "title": "Potato Seed Selection",
            "content": "Select certified disease-free seed tubers. Prefer medium-sized tubers (40-60mm). Cut large tubers 2-3 days before planting, ensuring each piece has 2-3 eyes. Treat cut surfaces with ash or fungicide.",
            "advisory_type": "planting",
            "growth_stage": "land_prep",
            "season": "long_rains",
            "counties_applicable": ["Nairobi", "Kiambu", "Nakuru", "Nyandarua", "Uasin Gishu"]
        },
        {
            "crop_name": "potatoes",
            "title": "Potato Planting Guidelines",
            "content": "Plant at 10-15cm depth, 30cm between plants, 75cm between rows. Apply well-rotted manure at 20 tons per hectare. Apply NPK fertilizer at planting. Ridge soil around plants as they grow (earthing up).",
            "advisory_type": "planting",
            "growth_stage": "planting",
            "season": "long_rains",
            "counties_applicable": ["Nairobi", "Kiambu", "Nakuru", "Nyandarua", "Uasin Gishu"]
        },
        {
            "crop_name": "potatoes",
            "title": "Potato Late Blight Warning",
            "content": "High humidity and cool temperatures favor late blight. Apply preventive fungicides before symptoms appear. Remove volunteer potatoes. Ensure proper field drainage. Monitor weather conditions daily.",
            "advisory_type": "disease_alert",
            "growth_stage": "vegetative",
            "season": "long_rains",
            "counties_applicable": ["Nairobi", "Kiambu", "Nakuru", "Nyandarua", "Uasin Gishu"]
        }
    ]
    
    # General advisories for all crops
    general_advisories = [
        {
            "crop_name": "maize",
            "title": "Irrigation Best Practices",
            "content": "Apply water early morning or late evening to reduce evaporation. Use drip irrigation where possible for water efficiency. Monitor soil moisture regularly. Avoid overwatering which can cause root diseases.",
            "advisory_type": "irrigation",
            "growth_stage": None,
            "season": "dry_season",
            "counties_applicable": None
        },
        {
            "crop_name": "beans",
            "title": "Water Conservation",
            "content": "Mulch around plants to conserve soil moisture. Use drought-resistant varieties during dry seasons. Practice conservation agriculture. Harvest rainwater for irrigation during dry periods.",
            "advisory_type": "irrigation",
            "growth_stage": None,
            "season": "dry_season",
            "counties_applicable": None
        },
        {
            "crop_name": "tomatoes",
            "title": "Integrated Pest Management",
            "content": "Use biological control methods where possible. Rotate pesticides to prevent resistance. Monitor pest populations regularly. Use physical barriers like nets. Encourage beneficial insects.",
            "advisory_type": "pest_control",
            "growth_stage": None,
            "season": "all",
            "counties_applicable": None
        }
    ]
    
    # Combine all advisories
    all_advisories = maize_advisories + beans_advisories + tomato_advisories + potato_advisories + general_advisories
    
    # Create Advisory objects
    for adv_data in all_advisories:
        advisory = Advisory(**adv_data)
        advisories.append(advisory)
    
    # Add to database
    try:
        for advisory in advisories:
            db.session.add(advisory)
        
        db.session.commit()
        
        print(f"✅ Successfully seeded {len(advisories)} advisory records")
        print(f"🌾 Crops covered: maize, beans, tomatoes, potatoes")
        print(f"📝 Advisory types: planting, nutrition, pest_control, irrigation, harvest, disease_alert")
        print(f"🌍 Counties: Multiple counties covered with specific and general advisories")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error seeding advisory data: {str(e)}")
        raise

if __name__ == "__main__":
    # Import app to ensure we're in Flask context
    from app import create_app
    app = create_app('development')
    
    with app.app_context():
        seed()
