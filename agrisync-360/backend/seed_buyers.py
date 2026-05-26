import sys
sys.path.insert(0, '.')

from app import create_app
from app.extensions import db
from app.models.market_pro import BuyerDirectory

app = create_app('development')

BUYERS = [
    {
        'business_name': 'Nairobi Fresh Produce Ltd',
        'contact_name': 'James Mwangi',
        'phone': '+254722100001',
        'buyer_type': 'retailer',
        'crops_wanted': ['tomatoes', 'cabbage', 'kale', 'onions'],
        'counties_served': ['Nairobi', 'Kiambu', 'Nakuru'],
        'minimum_quantity_kg': 500,
        'quality_requirements': 'Grade 1 only, clean, no blemishes',
        'payment_terms': 'Payment within 7 days of delivery',
        'is_verified': True,
    },
    {
        'business_name': 'East Africa Maize Millers',
        'contact_name': 'Grace Wanjiru',
        'phone': '+254733200002',
        'buyer_type': 'processor',
        'crops_wanted': ['maize', 'wheat', 'sorghum'],
        'counties_served': ['Nakuru', 'Uasin Gishu', 'Trans Nzoia', 'Nyandarua'],
        'minimum_quantity_kg': 5000,
        'quality_requirements': 'Moisture below 13.5%, no aflatoxin',
        'payment_terms': 'Cash on delivery for first 3 deliveries',
        'certifications_required': [],
        'is_verified': True,
    },
    {
        'business_name': 'Highlands Export Company',
        'contact_name': 'Peter Kimani',
        'phone': '+254744300003',
        'buyer_type': 'exporter',
        'crops_wanted': ['beans', 'potatoes', 'tomatoes'],
        'counties_served': ['Meru', 'Nyeri', 'Kiambu', 'Nakuru'],
        'minimum_quantity_kg': 2000,
        'quality_requirements': 'GlobalGAP certified preferred, EU standards',
        'payment_terms': '50% upfront, 50% on delivery',
        'certifications_required': ['kenya_gap', 'global_gap'],
        'is_verified': True,
    },
    {
        'business_name': 'Safari Hotels & Lodges',
        'contact_name': 'Mary Njoki',
        'phone': '+254755400004',
        'buyer_type': 'hotel',
        'crops_wanted': ['tomatoes', 'cabbage', 'kale', 'onions', 'potatoes'],
        'counties_served': ['Nairobi', 'Nakuru', 'Laikipia'],
        'minimum_quantity_kg': 100,
        'quality_requirements': 'Fresh, organic preferred, weekly supply',
        'payment_terms': 'Monthly invoicing',
        'is_verified': False,
    },
    {
        'business_name': 'Unga Group Flour Mills',
        'contact_name': 'David Ochieng',
        'phone': '+254766500005',
        'buyer_type': 'processor',
        'crops_wanted': ['maize', 'wheat'],
        'counties_served': ['All counties'],
        'minimum_quantity_kg': 10000,
        'quality_requirements': 'EAC Grade 1, certified warehouse receipts accepted',
        'payment_terms': 'Against warehouse receipt or cash',
        'is_verified': True,
    },
    {
        'business_name': 'Kenya Vegetable Exporters Association',
        'contact_name': 'Sarah Kamau',
        'phone': '+254711600006',
        'buyer_type': 'exporter',
        'crops_wanted': ['French beans', 'snow peas', 'broccoli', 'avocado'],
        'counties_served': ['Kiambu', 'Muranga', 'Meru', 'Nyeri'],
        'minimum_quantity_kg': 1000,
        'quality_requirements': 'EU market standards, GlobalGAP required',
        'payment_terms': '45 days after delivery',
        'certifications_required': ['global_gap', 'kenya_gap', 'haccp'],
        'is_verified': True,
    },
    {
        'business_name': 'County Government School Feeding Program',
        'contact_name': 'John Kipkorir',
        'phone': '+254722700007',
        'buyer_type': 'government',
        'crops_wanted': ['maize', 'beans', 'vegetables'],
        'counties_served': ['Nakuru'],
        'minimum_quantity_kg': 2000,
        'quality_requirements': 'KBS standards, inspected by county agricultural officers',
        'payment_terms': '30 days after delivery, county treasury',
        'is_verified': True,
    },
    {
        'business_name': 'Fresh Mart Supermarkets',
        'contact_name': 'Alice Wanjiku',
        'phone': '+254733800008',
        'buyer_type': 'retailer',
        'crops_wanted': ['tomatoes', 'onions', 'potatoes', 'carrots', 'cabbage'],
        'counties_served': ['Nairobi', 'Machakos', 'Kajiado'],
        'minimum_quantity_kg': 300,
        'quality_requirements': 'Consistent quality, uniform sizing, proper packaging',
        'payment_terms': 'Net 30 days',
        'is_verified': True,
    },
]

with app.app_context():
    existing = BuyerDirectory.query.count()
    if existing == 0:
        for buyer_data in BUYERS:
            buyer = BuyerDirectory(**buyer_data)
            db.session.add(buyer)
        db.session.commit()
        print(f"Seeded {len(BUYERS)} buyers")
    else:
        print(f"Already have {existing} buyers")
