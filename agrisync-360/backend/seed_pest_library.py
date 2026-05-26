import sys
sys.path.insert(0, '.')

from app import create_app
from app.extensions import db
from app.models.farm_intelligence import PestDiseaseEntry

app = create_app('development')

PESTS_DISEASES = [
    {
        'name': 'Fall Armyworm',
        'local_name': 'Mbuu wa Mahindi',
        'scientific_name': 'Spodoptera frugiperda',
        'type': 'pest',
        'affected_crops': ['maize', 'sorghum', 'sugarcane'],
        'symptoms': 'Ragged holes in leaves, sawdust-like frass in whorl, damage to tassels and ears',
        'spread_method': 'Moth migration, wind dispersal',
        'favorable_conditions': 'Warm temperatures (20-30°C), high humidity, young maize plants',
        'severity': 'critical',
        'organic_control': 'Neem oil, Bacillus thuringiensis (Bt), handpicking larvae, pheromone traps',
        'chemical_control': 'Coragen, Ampligo, Teldor, Belt, Emerald - apply to whorl in evening',
        'kenya_products': ['Coragen 18.5 SC', 'Ampligo 150 ZC', 'Teldor 240 SC', 'Belt 480 SC'],
        'prevention': 'Early planting, resistant varieties, crop rotation, field sanitation, push-pull technology',
        'is_active': True,
    },
    {
        'name': 'Maize Lethal Necrosis',
        'local_name': 'MLN',
        'scientific_name': 'Maize chlorotic mottle virus + sugarcane mosaic virus',
        'type': 'disease',
        'affected_crops': ['maize'],
        'symptoms': 'Chlorotic mottling, necrosis starting from leaf margins, premature drying, stunted growth, poor cob fill',
        'spread_method': 'Insect vectors (thrips, leafhoppers), contaminated seed, mechanical transmission',
        'favorable_conditions': 'Presence of vectors, continuous maize cultivation, stress conditions',
        'severity': 'critical',
        'organic_control': 'No effective organic control - prevention through resistant varieties',
        'chemical_control': 'Control insect vectors with appropriate insecticides, use certified MLN-resistant seed',
        'kenya_products': ['MLN-resistant hybrid seeds', 'Thrip control insecticides'],
        'prevention': 'Use MLN-resistant varieties, control insect vectors, crop rotation, avoid late planting',
        'is_active': True,
    },
    {
        'name': 'Aphids',
        'local_name': 'Vidue',
        'scientific_name': 'Aphididae family',
        'type': 'pest',
        'affected_crops': ['kale', 'cabbage', 'tomatoes', 'beans', 'potatoes'],
        'symptoms': 'Curled leaves, sticky honeydew, sooty mold, stunted growth, yellowing',
        'spread_method': 'Winged migration, ant farming, plant-to-plant movement',
        'favorable_conditions': 'Cool dry weather, high nitrogen fertilization, new growth',
        'severity': 'medium',
        'organic_control': 'Neem oil, soapy water spray, lady beetles, lacewings, garlic spray',
        'chemical_control': 'Dimethoate, Imidacloprid, Acetamiprid - rotate modes of action',
        'kenya_products': ['Rogator E 60', 'Confidor 200 SL', 'Mospilan 20 SP'],
        'prevention': 'Avoid over-fertilization, encourage beneficial insects, remove infested leaves',
        'is_active': True,
    },
    {
        'name': 'Late Blight',
        'local_name': 'Kunguni wa Nyanya',
        'scientific_name': 'Phytophthora infestans',
        'type': 'disease',
        'affected_crops': ['tomatoes', 'potatoes'],
        'symptoms': 'Water-soaked lesions, white fungal growth on underside, blackened stems, rapid plant collapse',
        'spread_method': 'Fungal spores via wind, rain splash, contaminated tools',
        'favorable_conditions': 'Cool wet weather (15-25°C), high humidity, leaf wetness',
        'severity': 'critical',
        'organic_control': 'Copper fungicides, resistant varieties, proper spacing, avoid overhead irrigation',
        'chemical_control': 'Mancozeb, Chlorothalonil, Metalaxyl, Cymoxanil - apply preventatively',
        'kenya_products': ['Dithane M-45', 'Ridomil Gold', 'Curzate M8'],
        'prevention': 'Resistant varieties, crop rotation, avoid overhead watering, proper spacing',
        'is_active': True,
    },
    {
        'name': 'Bacterial Wilt',
        'local_name': 'Bacterial wilt',
        'scientific_name': 'Ralstonia solanacearum',
        'type': 'disease',
        'affected_crops': ['tomatoes', 'potatoes', 'bananas', 'tobacco'],
        'symptoms': 'Sudden wilting, yellowing leaves, brown discoloration in stem, stunted growth',
        'spread_method': 'Contaminated soil, water, tools, infected seed tubers',
        'favorable_conditions': 'Warm temperatures (25-35°C), high soil moisture, poor drainage',
        'severity': 'high',
        'organic_control': 'Soil solarization, crop rotation with non-hosts, resistant varieties',
        'chemical_control': 'No effective chemical control - focus on prevention',
        'kenya_products': ['Resistant varieties', 'Soil fumigants (limited use)'],
        'prevention': 'Use certified disease-free seed, crop rotation (4-5 years), avoid waterlogged soils',
        'is_active': True,
    },
    {
        'name': 'Nitrogen Deficiency',
        'local_name': 'Upungufu wa Nitrogeni',
        'scientific_name': 'Nitrogen deficiency',
        'type': 'deficiency',
        'affected_crops': ['maize', 'wheat', 'vegetables'],
        'symptoms': 'Yellowing of older leaves (chlorosis), stunted growth, thin stems, reduced yield',
        'spread_method': 'Not applicable - soil nutrient issue',
        'favorable_conditions': 'Sandy soils, low organic matter, leaching, insufficient fertilization',
        'severity': 'medium',
        'organic_control': 'Compost, manure, legume cover crops, green manures',
        'chemical_control': 'Urea, CAN, DAP - apply based on soil test recommendations',
        'kenya_products': ['Urea 46% N', 'CAN 26% N', 'DAP 18% N'],
        'prevention': 'Regular soil testing, balanced fertilization, maintain organic matter',
        'is_active': True,
    },
    {
        'name': 'Striga',
        'local_name': 'Oyayi',
        'scientific_name': 'Striga hermonthica',
        'type': 'weed',
        'affected_crops': ['maize', 'sorghum', 'millet', 'rice'],
        'symptoms': 'Purple/pink flowers on host plants, stunted growth, chlorosis, wilting',
        'spread_method': 'Seeds dispersed by wind, water, animals, contaminated soil',
        'favorable_conditions': 'Low soil fertility, drought stress, continuous cereal cultivation',
        'severity': 'high',
        'organic_control': 'Hand pulling before seed set, crop rotation, trap crops, soil fertility improvement',
        'chemical_control': 'Herbicide-coated seeds, imazapyr-resistant maize varieties',
        'kenya_products': ['StrigAway (imazapyr-coated maize)', 'Herbicide seed treatments'],
        'prevention': 'Use Striga-resistant varieties, improve soil fertility, crop rotation, hand pulling',
        'is_active': True,
    },
    {
        'name': 'Tuta Absoluta',
        'local_name': 'Tuta Absoluta',
        'scientific_name': 'Phthorimaea operculella',
        'type': 'pest',
        'affected_crops': ['tomatoes', 'potatoes'],
        'symptoms': 'Leaf mines, pinholes on leaves, fruit damage, frass on leaves and fruits',
        'spread_method': 'Adult moth flight, infested seedlings, contaminated materials',
        'favorable_conditions': 'Warm temperatures (20-30°C), protected cultivation, continuous tomato production',
        'severity': 'critical',
        'organic_control': 'Pheromone traps, biological control (Trichogramma wasps), mass trapping',
        'chemical_control': 'Coragen, Radiant, Avaunt - target larvae, rotate modes of action',
        'kenya_products': ['Coragen 18.5 SC', 'Radiant 100 SC', 'Avaunt 150 SC'],
        'prevention': 'Pheromone monitoring, clean seedlings, avoid continuous tomato in same area',
        'is_active': True,
    },
]

with app.app_context():
    existing = PestDiseaseEntry.query.count()
    if existing == 0:
        for pest_data in PESTS_DISEASES:
            pest = PestDiseaseEntry(**pest_data)
            db.session.add(pest)
        db.session.commit()
        print(f"Seeded {len(PESTS_DISEASES)} pest/disease entries")
    else:
        print(f"Already have {existing} entries")
