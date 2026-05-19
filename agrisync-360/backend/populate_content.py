#!/usr/bin/env python3
"""
AgriSync 360 — Content Population Script
Populates database with realistic Kenyan agricultural data
"""

import sys
import os
import random
from datetime import date, timedelta
from flask import Flask
from sqlalchemy import text
from app import create_app, db
import logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
from app.models.advisory import Advisory
from app.models.market import Market
from app.models.user import User

# ============================================================
# COMPREHENSIVE KENYAN CROP ADVISORIES
# ============================================================

ADVISORIES = [
    # ===== MAIZE =====
    {
        'crop_name': 'maize',
        'title': 'Kupanda Mahindi — Mwongozo Kamili',
        'advisory_type': 'planting',
        'season': 'long_rains',
        'content': '''
KUPANDA MAHINDI — MPAKA WA MAMBO

Wakati wa Kupanda:
- Panda mwanzo wa mvua masika (Machi-Mei)
- Ardhi iwe na mbolea ya kutosha
- PH ya ardhi: 5.5-6.5 (kiharusia kwa mahindi)

Aina Bora za Kenya:
- H614D — Mavuno mengi, sugu kwa magonjwa
- H6213 — Mavuno ya haraka, sugu kwa ukame
- DH04 — Sugu kwa magonjwa ya majani
- Duma 43 — Inakua haraka, mahindi tamu

Kiwango cha Kupanda:
- Umbali wa safu: 75cm (miti 30 kati ya mmea)
- Kina cha kupanda: sentimita 5
- Kiwango cha mbegu: 25kg kwa ekari moja

Baada ya Kupanda:
Weka matandazo (mulch) kuzuia unyevu kupotea na magugu kukua.
Angalia viota baada ya siku 7 — panda tena mahali ambapo mbegu 
haikumea.
        ''',
        'is_active': True,
    },
    {
        'crop_name': 'maize',
        'title': 'Mbolea ya Mahindi — Ratiba Kamili',
        'advisory_type': 'nutrition',
        'season': 'all',
        'content': '''
MBOLEA YA MAHINDI — RATIBA YA NPK

Wakati wa Kupanda (Mbolea ya Msingi):
- DAP (Di-Ammonium Phosphate): Kilo 50 kwa ekari
- Weka kwenye shimo kabla ya mbegu au pembeni ya mbegu
- DAP inasaidia mizizi kukua haraka

Wiki 4-6 Baada ya Kupanda (Top Dressing):
- CAN (Calcium Ammonium Nitrate): Kilo 50 kwa ekari
- Weka pande zote za mmea, sentimita 10 kutoka shina
- Usiweke juu ya majani — itaungua

Wiki 8-10 (Mbolea ya Pili ya CAN):
- Ongeza CAN nyingine kilo 25-50 kwa ekari
- Hasa wakati wa kutoa inflorescence (tasseling)
- Hii inasaidia mazao kukua vizuri

Mbolea za Majani (Foliar):
- Nyunyiza wiki 6 na wiki 10
- Tumia mbolea yenye micronutrients (Zinc, Boron)
- Asubuhi mapema au jioni — si wakati wa jua kali

Dalili za Upungufu:
- Majani ya njano kuanzia chini: Upungufu wa Nitrogen
- Majani nyekundu/zambarau: Upungufu wa Phosphorus  
- Ukame wa ncha ya majani: Upungufu wa Potassium

Onyo: Usichanganye DAP na CAN wakati mmoja. 
Wape ardhi siku 2-3 kati ya matumizi.
        ''',
        'is_active': True,
    },
    {
        'crop_name': 'maize',
        'title': 'Wadudu wa Mahindi — FAW na Wengine',
        'advisory_type': 'pest_control',
        'season': 'all',
        'content': '''
WADUDU HATARI WA MAHINDI NA JINSI YA KUDHIBITI

1. FALL ARMYWORM (FAW) — Spodoptera frugiperda
Hatari kubwa zaidi kwa mahindi Kenya tangu 2017.

Dalili za Kushambuliwa:
- Mashimo kwenye majani mapya
- Uchafu mzito (frass) mfano wa mchanga mzito
- Viwavi wanaonekana usiku au asubuhi mapema

Udhibiti wa Kemikali:
- Coragen (Chlorantraniliprole) — bora zaidi, wiki 3-5
- Ampligo — haraka, wiki 2-3
- Duduthrin — Bei nafuu, wiki 2
- Nyunyiza kwenye ncha ya mmea (kiwango cha maji: lita 300-400 kwa ekari)

Udhibiti wa Kibiolojia:
- NPV (Nuclear Polyhedrosis Virus) — Salama kwa mazingira
- Trichogramma wasps — Nyunyiza mwanzo wa shambulio

Kuzuia:
- Angalia shamba wiki 2 baada ya kupanda
- Mzunguko wa mazao na mahindi
- Panda wakati mmoja — FAW huenea polepole

2. STALK BORER — Busseola fusca
Hutobola shina la mahindi.
Dawa: Furadan (Carbofuran) au Duduthrin kwenye makundi ya majani.

3. APHIDS — Rhopalosiphum maidis
Husababisha ukuaji mdogo na kueneza virusi.
Dawa: Karate au Actara. Angalia sana wakati wa kiangazi.
        ''',
        'is_active': True,
    },
    {
        'crop_name': 'maize',
        'title': 'Magonjwa ya Mahindi — Utambuzi na Matibabu',
        'advisory_type': 'disease_alert',
        'season': 'all',
        'content': '''
MAGONJWA YA KAWAIDA YA MAHINDI KENYA

1. GREY LEAF SPOT — Cercospora zeae-maydis
Dalili: Madoa marefu ya rangi ya kijivu kwenye majani
Hali inayofaa: Unyevu zaidi ya 80%, joto 20-25°C
Matibabu: Amistar (Azoxystrobin) au Tilt (Propiconazole)
Kuzuia: Zunguka mazao, tumia aina zinazostahimili

2. MAIZE STREAK VIRUS (MSV)
Dalili: Mistari ya njano kwenye majani
Kusambazwa na: Leafhopper (kiroboto cha majani)
Matibabu: Hakuna — Ng'oa mmea ulioshambuliwa
Kuzuia: Dhibiti leafhoppers kwa Dimethoate, panda mapema

3. NORTHERN LEAF BLIGHT — Exserohilum turcicum
Dalili: Madoa makubwa ya kahawia kwenye majani
Matibabu: Ridomil Gold au dawa za shaba
Kuzuia: Tumia aina zinazostahimili

4. LATE WILT — Harpophora maydis
Dalili: Mmea kuanguka ghafla wiki 6-8 baada ya kupanda
Kuzuia: Mzunguko wa mazao, usirudie mahali pamoja mara nyingi

KANUNI YA MUHIMU:
Magonjwa mengi hushambuliwa zaidi wakati wa unyevu mwingi.
Pulizia dawa za kuzuia (preventive) wakati hali ya hewa ni hatari
(unyevu > 80%, joto 18-26°C).
        ''',
        'is_active': True,
    },
    {
        'crop_name': 'maize',
        'title': 'Mavuno ya Mahindi — Wakati na Uhifadhi',
        'advisory_type': 'harvest',
        'season': 'all',
        'content': '''
MAVUNO NA UHIFADHI WA MAHINDI

Wakati wa Kuvuna:
- Siku 90-120 baada ya kupanda (inategemea aina)
- Ganda la mahindi liwe kaharabu na kavu
- Punje ziwe ngumu ukizigusa
- Unyevu wa punje: chini ya 13.5% kwa uhifadhi salama

Jinsi ya Kuvuna:
1. Vuna asubuhi mapema kabla ya jua kali
2. Vuta bua chini kwa mkono au tumia panga
3. Kausha maharagwe kwenye seli/ngome iliyoinuliwa
4. Pigilia punje kwa mkono au mashine (thresher)

Kupima Unyevu:
Tumia moisture meter kupima unyevu wa punje.
Unyevu zaidi ya 14% = hatari ya ukungu na kukaa vibaya.

Uhifadhi Salama:
- Tumia mifuko ya hermetic (PICS bags, Purdue bags)
- Au silo metallic zilizofungwa vizuri
- Ongeza Actellic Super (Pirimiphos-methyl) kuzuia mba
- Weka mahali pakavu, baridi, na mbali na mwanga wa jua
- Angalia kila wiki 2 kwanza miezi 2

Mba (Grain Weevil — Sitophilus zeamais):
Husababisha hasara kubwa ghalani.
Dawa: Actellic Super dust, kilo 0.1 kwa kilo 100 za mahindi.
Au tumia mifuko ya hermetic — mba hufa bila hewa.

Bei ya Kuuzia:
Angalia bei za soko kwenye AgriSync 360 kabla ya kuuzia.
Bei ya mahindi huwa juu Julai-Agosti (kipindi cha upungufu).
        ''',
        'is_active': True,
    },

    # ===== BEANS =====
    {
        'crop_name': 'beans',
        'title': 'Kupanda Maharagwe — Mwongozo Kamili',
        'advisory_type': 'planting',
        'season': 'all',
        'content': '''
KUPANDA MAHARAGWE KWA MAVUNO BORA

Utangulizi:
Maharagwe ni zao zuri kwa mkulima mdogo kwa sababu:
- Inakua haraka (siku 60-90)
- Inaweza kupandwa peke yake au pamoja na mahindi
- Inaboresha ardhi kwa nitrogen (nitrogen fixation)

Wakati wa Kupanda:
Panda mwanzo wa mvua. Maharagwe inahitaji:
- Mvua ya kutosha: 300-400mm
- Joto: 15-27°C
- Ardhi: pH 5.5-7.0

Maandalizi ya Mbegu:
MUHIMU: Chanjo mbegu kwa Rhizobium bacteria kabla ya kupanda.
Hii inasaidia maharagwe kutengeneza nitrogen yake yenyewe — 
huhitaji mbolea ya nitrogen!
Chanjo (inoculant) inapatikana kwenye maduka ya pembejeo.

Umbali wa Kupanda:
Peke yake: Safu 45cm, mmea 10-15cm, kina 3-4cm
Pamoja na mahindi: Panda kati ya safu za mahindi

Aina Bora za Maharagwe Kenya:
- Rosecoco — nyekundu, maarufu, siku 70-75
- Mwitemania — nyekundu-nyeupe, mvua kidogo
- Lyamungu 85 — sugu ya magonjwa, mvua kidogo
- GLP-2 — sugu ya magonjwa ya majani
- CIAP 7742-T — sugu ya anthracnose

Usiweke DAP kwa maharagwe — itapunguza uotaji wa mizizi.
Tumia TSP (Triple Super Phosphate) badala yake kama unahitaji.
        ''',
        'is_active': True,
    },
    {
        'crop_name': 'beans',
        'title': 'Wadudu na Magonjwa ya Maharagwe',
        'advisory_type': 'pest_control',
        'season': 'all',
        'content': '''
WADUDU NA MAGONJWA YA MAHARAGWE

WADUDU:

1. BEAN FLY — Ophiomyia phaseoli
Hatari kubwa kipindi cha mche mdogo.
Dalili: Shina kubadilika rangi, mche kuanguka
Udhibiti: Tibu mbegu kwa Thiram au Gaucho kabla ya kupanda
Dawa: Dimethoate au Lannate baada ya kuota (mara 2-3)

2. APHIDS — Aphis fabae
Hukaa chini ya majani, husababisha kukunjamana kwa majani
Dawa: Karate, Actara, au sabuni ya kawaida

3. POD BORERS — Maruca vitrata
Hushambuliwa wakati wa maua na maganda
Dalili: Madoa kwenye maganda, mbegu zilizoharibiwa
Dawa: Karate au Coragen wakati wa maua

4. BEAN WEEVIL — Acanthoscelides obtectus
Kwenye ghala — huharibu mbegu zilizohifadhiwa
Kuzuia: Hermetic bags au Actellic Super

MAGONJWA:

1. ANGULAR LEAF SPOT — Phaeoisariopsis griseola
Dalili: Madoa ya pembetatu kwenye majani
Dawa: Dithane M45 (Mancozeb) au dawa za shaba

2. BEAN RUST — Uromyces appendiculatus  
Dalili: Vipande vya rangi ya kutu chini ya majani
Dawa: Tilt (Propiconazole) au Amistar

3. ANTHRACNOSE — Colletotrichum lindemuthianum
Dalili: Madoa meusi kwenye Maganda
Kuzuia: Mbegu safi, usizingatie rutuba nyingi ya nitrogen
Dawa: Amistar au Ridomil Gold

4. ROOT ROT — Fusarium/Pythium spp.
Husababishwa na ardhi iliyojaa maji
Kuzuia: Mifereji mizuri, usipande mahali palipojaa maji
        ''',
        'is_active': True,
    },

    # ===== POTATOES =====
    {
        'crop_name': 'potatoes',
        'title': 'Kupanda Viazi — Mbinu za Kisasa',
        'advisory_type': 'planting',
        'season': 'all',
        'content': '''
KUPANDA VIAZI KWA MAVUNO MAKUBWA

Utangulizi:
Viazi ni zao la thamani kubwa Kenya, hasa Nyandarua, Meru, Laikipia.
Ekari moja inaweza kutoa tani 8-20 ukifuata mwongozo huu.

Mbegu Bora:
MUHIMU: Tumia mbegu safi zilizoidhinishwa (certified seed potatoes)
Mbegu "local" mara nyingi zina magonjwa ya virusi.
Mbegu bora: Dutch Robyjn, Shangi, Tigoni, Kenya Mpya, Jelly

Maandalizi ya Mbegu:
- Katakata mbegu kwa vipande vya gramu 30-50 kila moja
- Kila kipande kiwe na "jicho" (eye) 1-2
- Acha vipande vikauka siku 2-3 kabla ya kupanda (suberization)
- Dip katika dawa ya fungicide (Ridomil) kwa dakika 5

Maandalizi ya Ardhi:
- Lima kina sentimita 25-30
- Ongeza mbolea ya samadi: tani 5-10 kwa ekari
- pH ya ardhi: 5.0-6.0
- Ardhi iwe na mifereji mizuri — viazi havipendi maji

Kupanda:
Umbali: safu 75cm, mmea 30cm, kina 10-15cm
Ongeza DSP kilo 50 kwa ekari wakati wa kupanda

Wiki 6: Rudi (earthing up) — Funika mizizi na ardhi
Wiki 8-10: Earthing up ya pili

Umwagiliaji:
Viazi inahitaji maji mengi (400-600mm).
Umwagilia mara kwa mara wakati wa kukua.
Acha kumwagilia wiki 2 kabla ya kuvuna.
        ''',
        'is_active': True,
    },
    {
        'crop_name': 'potatoes',
        'title': 'Late Blight — Adui Mkubwa wa Viazi',
        'advisory_type': 'disease_alert',
        'season': 'long_rains',
        'content': '''
LATE BLIGHT — HATARI KUBWA YA VIAZI

Jina la Kisayansi: Phytophthora infestans
Hii ndiyo tatizo kubwa zaidi la viazi Kenya.
Inaweza kuua shamba lote ndani ya siku 7-14!

Hali Inayofaa:
- Joto: 10-25°C (baridi)
- Unyevu: zaidi ya 80%
- Umande wa usiku na mwanga wa siku

Dalili za Mapema:
- Madoa ya kijivu maji kwenye ncha na pembeni ya majani
- Chini ya jani: ukungu mzito mweupe
- Harufu ya kuoza

Mzunguko wa Uambukizi:
Ugonjwa husambaea kwa haraka sana wakati wa mvua na baridi.
Sporangia zinasafiri kwa upepo na maji ya mvua.

RATIBA YA KUNYUNYIZA DAWA:

Wiki 3 baada ya kuota:
- Anza kunyunyiza dawa za kuzuia (preventive)
- Tumia: Ridomil Gold MZ (Metalaxyl + Mancozeb)

Wakati wa Mvua/Baridi (Kila Siku 5-7):
- Ridomil Gold MZ au Acrobat MZ
- Ratiba hii ni lazima — Usiruke hata siku moja!

Wakati wa Jua (Kila Wiki 10-14):
- Dithane M45 (Mancozeb) peke yake ni ya kutosha
- Ratiba hii ni lazima — Usiruke hata siku moja!

Baada ya Shambulio:
- Tumia dawa za kutibu (curative): Infinito, Revus
- Ng'oa na choma mimea iliyoathiriwa vibaya

Dawa Zingine za Blight:
- Curzate (Cymoxanil + Mancozeb) — preventive + curative
- Forum Star (Dimethomorph + Mancozeb) — kwa hali mbaya
- Shirlan (Fluazinam) — kuzuia tu

MUHIMU: Angalia hali ya hewa kila siku kwenye AgriSync 360.
Ikiwa hatari ya blight ni HIGH au VERY HIGH — nyunyiza siku hiyo hiyo!
        ''',
        'is_active': True,
    },

    # ===== TOMATOES =====
    {
        'crop_name': 'tomatoes',
        'title': 'Kupanda Nyanya — Mwongozo wa Kina',
        'advisory_type': 'planting',
        'season': 'all',
        'content': '''
KUPANDA NYANYA KWA MAFANIKIO

Utangulizi:
Nyanya ni zao la thamani kubwa lakini inahitaji Uangalifu.
Bei ya nyanya inaweza kubadilika haraka sana.

Hatua ya 1 — Kitalu (Nursery):
- Panda mbegu kwenye chombo kidogo au mkoba wa plastiki
- Udongo: mchanganyiko wa mchanga, mboji, na udongo (1:1:2)
- Funika kwa bagi baada ya kupanda hadi mbegu ziote
- Muda: wiki 3-4 kabla ya kupandikiza

Mbegu Bora za Nyanya Kenya:
- Tylka F1 — sugu ya virusi (TYLCV), maarufu
- Terminator F1 — mazao mengi, sugu
- Anna F1 — sugu ya blight, mazao mazuri
- Kilele F1 — kwa maeneo ya chini
- Zawadi F1 — kutoka Technisem

Kupandikiza:
- Pandikiza wakati miche ina majani 4-6
- Umbali: safu 90-100cm, mmea 50-60cm
- Wakati: jioni au siku ya mawingu
- Mwagilia vizuri baada ya kupandikiza

Staking (Kumpigia Nguzo):
- Piga nguzo mara tu baada ya kupandikiza
- Nguzo urefu sentimita 180-200
- Funga mmea vizuri lakini usibanane
- Topping: kata ncha ya mmea wiki 8-10 (baada ya tawi 4-5)

Matandazo (Mulching):
Weka matandazo kuzuia:
- Maji kupotea
- Magugu kukua
- Magonjwa ya ardhi kushambuliwa majani
        ''',
        'is_active': True,
    },
    {
        'crop_name': 'tomatoes',
        'title': 'Wadudu wa Nyanya — Tuta Absoluta na Wengine',
        'advisory_type': 'pest_control',
        'season': 'all',
        'content': '''
WADUDU HATARI WA NYANYA

1. TUTA ABSOLUTA — Tomato Leafminer
Hii ndiyo tatizo kubwa zaidi la nyanya Kenya tangu 2016.

Dalili:
- Vichugu (mines) ndani ya jani
- Maganda yenye mashimo
- Mbegu zilizoharibika

Udhibiti:
- Coragen (Chlorantraniliprole): bora zaidi
- Ampligo: haraka na yenye nguvu
- Karate (Lambda-cyhalothrin): bei nafuu
- Pheromone traps: kuzuia dume

Zunguka dawa kila nyunyiwa ili kuzuia ukinzani wa dawa.

2. RED SPIDER MITE — Tetranychus urticae
Hushambuliwa wakati wa jua kali na ukame.
Dalili: Majani kugeuka njano, kuonekana mchanga chini

Dawa: Abamectin (Dynamec), Oberon, au sabuni maalum ya mite.
Nyunyiza chini ya majani (hapo ndipo wanaishi).

3. WHITEFLY — Bemisia tabaci
Husambaza virusi (TYLCV) hatari.
Dalili: Nzi weupe wadogo wakuruke ukigusa mmea

Dawa: Actara (Thiamethoxam), Confidor (Imidacloprid)
Tumia traps za njano (yellow sticky traps) — usisahau!

4. APHIDS
Husambaza virusi na kusababisha ukuaji mbaya.
Dawa: Karate, Actara, au sabuni ya kawaida

KANUNI:
- Angalia shamba kila siku
- Ng'oa na choma mimea iliyoshambuliwa vibaya
- Zunguka familia za dawa ili kuzuia ukinzani
        ''',
        'is_active': True,
    },

    # ===== TEA =====
    {
        'crop_name': 'tea',
        'title': 'Usimamizi wa Chai — Mwongozo wa Mkulima',
        'advisory_type': 'general',
        'season': 'all',
        'content': '''
USIMAMIZI WA CHAI — TAARIFA KAMILI

Utangulizi:
Chai (Camellia sinensis) ni zao la kudumu Kenya.
Kenya ni mzalishaji wa 3 dunia — ubora wa chai ya Kenya ni Bora sana.

Upandaji wa Chai:
- Chai hupandwa kwa vipandikizi (cuttings)
- Umbali: safu 120cm, mmea 60-75cm
- Ardhi: pH 4.5-5.5 (tindikali)
- Mvua: 1200-1400mm kwa mwaka

Kuchuma (Plucking):
- Kuanza kuchuma miaka 3-4 baada ya kupanda
- Chuma kila siku 7-14 (inategemea ukuaji)
- "Fine plucking": bua moja + majani mawili mapya
- Usiachilie chai kukua muda mrefu — ubora hupungua

Mbolea ya Chai:
Mara 2 kwa mwaka (Machi-Aprili na Septemba-Oktoba):
- CAN: kilo 125 kwa ekari
- Au mbolea maalum ya chai (6:4:4 + micronutrients)
- Mbolea ya majani kila miezi 3

Kupogoa (Pruning):
Kila miaka 3-5, kata mmea kwa urefu sentimita 60-75.
Pruning inasaidia:
- Ukuaji mpya wa haraka
- Kuenea kwa tawi
- Kuzuia magonjwa

FAIDA KWA MKULIMA:
Malipo kupitia KTDA yanalingana na uzito wa jani lake.
Ikiwa unazalisha lita 100 kwa siku — unaweza kupata KSH 2,000-3,000 kwa siku.
Hifadhi rekodi ya uzalishaji wako kila siku.
        ''',
        'is_active': True,
    },
    {
        'crop_name': 'tea',
        'title': 'Magonjwa ya Chai — Blister Blight na Wengine',
        'advisory_type': 'disease_alert',
        'season': 'long_rains',
        'content': '''
MAGONJWA YA CHAI

1. BLISTER BLIGHT — Exobasidium vexans
Tatizo kubwa zaidi la chai wakati wa mvua.

Dalili:
- Viputo (blisters) kwenye majani mapya
- Majani mapya kugeuka rangi ya pink-nyeupe
- Inasababisha upotezaji mkubwa wa uzalishaji

Hali Inayofaa:
- Mvua zaidi ya 200mm kwa mwezi
- Unyevu zaidi ya 85%
- Joto: 16-24°C

Matibabu:
- Dawa za shaba (Copper Oxychloride, Copper Hydroxide)
- Nyunyiza kila wiki 7-10 wakati wa mvua nyingi
- Ongeza mara ya kunyunyiza wakati mvua ni nyingi sana

Kanuni ya Spraying:
Asubuhi mapema kabla ya mvua au jioni baada ya mvua kusimama.
Usinyunyize wakati wa mvua — dawa itaosha.

2. TEA MOSQUITO BUG — Helopeltis schoutedeni
Dalili: Madoa meusi kwenye majani mapya, mashina kunyauka
Dawa: Endosulfan au Fenvalerate

3. RED SPIDER MITE — Oligonychus coffeae
Hushambuliwa wakati wa kiangazi.
Dalili: Majani ya zambarau, uzalishaji mdogo
Dawa: Milbeknock (Milbemectin), Abamectin

4. PURPLE MITE — Calacarus carinatus
Husababisha majani kugeuka zambarau/shaba
Dawa: Nyunyiza mafuta ya tumbaku au Dicofol

TAARIFA:
Ripoti magonjwa yoyote mapya kwa afisa wa KTDA au Tea Board of Kenya.
        ''',
        'is_active': True,
    },
]

# ============================================================
# MARKET PRICES — Realistic Kenya Data
# ============================================================

MARKET_DATA = {
    'maize': {'nairobi': (48, 65), 'nakuru': (42, 58), 'meru': (45, 60), 
              'kisumu': (50, 68), 'mombasa': (52, 72), 'kiambu': (46, 62),
              'uasin_gishu': (40, 55)},
    'beans': {'nairobi': (130, 180), 'nakuru': (120, 165), 'meru': (125, 170),
              'kisumu': (135, 185), 'mombasa': (140, 190), 'kiambu': (128, 175)},
    'potatoes': {'nairobi': (35, 65), 'nakuru': (28, 52), 'meru': (30, 55),
                 'kisumu': (38, 68), 'mombasa': (42, 75), 'kiambu': (32, 58)},
    'tomatoes': {'nairobi': (55, 150), 'nakuru': (45, 130), 'meru': (50, 140),
                 'kisumu': (60, 155), 'mombasa': (65, 170), 'kiambu': (52, 145)},
    'tea': {'nairobi': (20, 35), 'nakuru': (18, 32), 'meru': (22, 38),
            'kisumu': (19, 33), 'kiambu': (21, 36)},
    'wheat': {'nairobi': (52, 75), 'nakuru': (48, 70), 'uasin_gishu': (45, 65),
              'kiambu': (50, 72)},
    'cabbage': {'nairobi': (25, 55), 'nakuru': (20, 45), 'meru': (22, 50),
                'kisumu': (28, 58), 'kiambu': (23, 48)},
    'kale': {'nairobi': (18, 35), 'nakuru': (15, 30), 'meru': (16, 32),
             'kisumu': (20, 38), 'kiambu': (17, 33)},
    'onions': {'nairobi': (65, 120), 'nakuru': (58, 108), 'kisumu': (70, 125),
               'mombasa': (75, 130), 'kiambu': (62, 115)},
    'sorghum': {'nairobi': (40, 60), 'kisumu': (35, 55), 'meru': (38, 58)},
}

MARKETS = {
    'nairobi': ['Wakulima Market', 'City Market Nairobi', 'Gikomba Market'],
    'nakuru': ['Nakuru Municipal Market', 'Westside Market'],
    'meru': ['Meru Town Market', 'Makutano Market'],
    'kisumu': ['Kisumu Central Market', 'Kibuye Market'],
    'mombasa': ['Kongowea Market', 'Marikiti Market'],
    'kiambu': ['Kiambu Market', 'Ruiru Market'],
    'uasin_gishu': ['Eldoret Market', 'Eldoret Municipal'],
}

# ============================================================
# SMS ADVISORY MESSAGES
# ============================================================

SMS_ADVISORIES = [
    {
        'title': 'Mvua Wiki Hii',
        'message': 'AgriSync 360: Mvua inatarajiwa wiki hii. '
                   'Wakati mzuri wa kupanda mahindi au kupiga '
                   'mbolea. Angalia hali ya hewa zaidi: *384*360#',
        'category': 'weather_alert',
    },
    {
        'title': 'Onyo la Blight — Viazi',
        'message': 'AgriSync 360 ONYO: Hali ya hewa inafaa blight '
                   'ya viazi (unyevu > 80%). Nyunyiza Ridomil Gold '
                   'leo hii. Usisubiri!',
        'category': 'disease_alert',
    },
    {
        'title': 'Bei ya Nyanya Imepanda',
        'message': 'AgriSync 360 Soko: Bei ya nyanya Nairobi imepanda '
                   '35% — KSH 120/kg sasa. Fikiria kuuzia wiki hii. '
                   'Bei zaidi: *384*360#',
        'category': 'market_alert',
    },
    {
        'title': 'Ushauri wa Jumamosi',
        'message': 'AgriSync 360: Ushauri wa wiki — Angalia mashamba '
                   'yako kwa dalili za FAW (fall armyworm). Madoa '
                   'mapya kwenye mahindi? Nyunyiza Coragen haraka.',
        'category': 'weekly_advisory',
    },
    {
        'title': 'Dirisha la Kupanda',
        'message': 'AgriSync 360: Hali nzuri ya kupanda! Mvua ya '
                   'kutosha inatarajiwa siku 3 zijazo. Wakati bora '
                   'wa kupanda mahindi au maharagwe.',
        'category': 'planting_window',
    },
    {
        'title': 'Mbolea — Wakati wa CAN',
        'message': 'AgriSync 360: Mahindi yako ni wiki 4-6? Wakati '
                   'wa kupiga mbolea ya CAN kilo 50 kwa ekari. '
                   'Piga kabla ya mvua ijayo.',
        'category': 'nutrition_reminder',
    },
    {
        'title': 'Kusaili Usajili',
        'message': 'AgriSync 360: Usajili wako unaisha siku 3. '
                   'Endelea kupata ushauri wa mazao na bei za soko. '
                   'Lipa kupitia M-Pesa Paybill 174379.',
        'category': 'subscription_reminder',
    },
    {
        'title': 'Hatari ya Baridi',
        'message': 'AgriSync 360 ONYO: Baridi kali inatarajiwa usiku '
                   'huu (chini ya 5°C). Linda mashamba ya chai na '
                   'pyrethrum yako sasa hivi.',
        'category': 'frost_warning',
    },
    {
        'title': 'Bei ya Maharagwe',
        'message': 'AgriSync 360 Soko: Bei ya maharagwe Mombasa '
                   'KSH 165/kg. Bei nzuri! Wasiliana na wafanyabiashara '
                   'wiki hii.',
        'category': 'market_alert',
    },
    {
        'title': 'Mavuno ya Viazi',
        'message': 'AgriSync 360: Viazi yako yamechukua siku 85+? '
                   'Angalia kwa kuchimba kidogo. Ganda zito = tayari '
                   'kuvuna. Uvunaji: acha kumwagilia wiki 2 kwanza.',
        'category': 'harvest_advisory',
    },
]


def run():
    app = create_app('development')
    with app.app_context():
        logger.info("="*60)
        logger.info("AgriSync 360 — Content Population Starting")
        logger.info("="*60)

        # 1. Clear and repopulate advisories
        logger.info("\n1. Populating crop advisories...")
        Advisory.query.delete()
        for adv_data in ADVISORIES:
            adv = Advisory(**adv_data)
            db.session.add(adv)
        db.session.commit()
        logger.info(f"   ✅ Created {len(ADVISORIES)} advisories")

        # 2. Populate market prices (30 days)
        logger.info("\n2. Populating market prices...")
        Market.query.delete()
        
        count = 0
        today = date.today()
        
        for crop, county_ranges in MARKET_DATA.items():
            for county, (price_min, price_max) in county_ranges.items():
                markets = MARKETS.get(county, [f'{county.title()} Market'])
                
                for days_ago in range(30):
                    record_date = today - timedelta(days=days_ago)
                    market = random.choice(markets)
                    
                    # Add realistic daily variation (±5%)
                    base_price = random.uniform(price_min, price_max)
                    variation = random.uniform(-0.05, 0.05)
                    price = round(base_price * (1 + variation), 2)
                    
                    mp = Market(
                        crop_name=crop,
                        county=county.replace('_', ' ').title(),
                        market_name=market,
                        price_per_kg=price,
                        price_per_unit=price * 90,
                        unit='kg',
                        demand_level=random.choice(
                            ['low', 'medium', 'high', 'very_high']
                        ),
                        source='AgriSync Market Intelligence',
                        recorded_date=record_date,
                    )
                    db.session.add(mp)
                    count += 1
        
        db.session.commit()
        logger.info(f"   ✅ Created {count} market price records")

        # 3. Create admin accounts
        logger.info("\n3. Creating admin and partner accounts...")
        
        admin_accounts = [
            {
                'phone': '+254700000001',
                'password': 'AgriAdmin2026!',
                'role': 'admin',
                'name': 'System Administrator'
            },
            {
                'phone': '+254700000002',
                'password': 'KilimoAdmin2026!',
                'role': 'admin',
                'name': 'Kilimo Extension Officer'
            },
            {
                'phone': '+254700000003',
                'password': 'NGOPartner2026!',
                'role': 'ngo_partner',
                'name': 'Kenya Farmers Trust NGO'
            },
            {
                'phone': '+254700000004',
                'password': 'County2026Admin!',
                'role': 'county_officer',
                'name': 'Nakuru County Agriculture'
            },
            {
                'phone': '+254700000005',
                'password': 'Dealer2026Agent!',
                'role': 'agro_dealer',
                'name': 'Nakuru Agro Supplies'
            },
        ]
        
        for acc in admin_accounts:
            existing = User.query.filter_by(phone=acc['phone']).first()
            if not existing:
                user = User(
                    phone=acc['phone'],
                    role=acc['role'],
                    is_active=True,
                    is_verified=True,
                )
                user.set_password(acc['password'])
                db.session.add(user)
                logger.info(f"   ✅ Created: {acc['name']} ({acc['role']})")
            else:
                logger.info(f"   ℹ️  Exists: {acc['phone']}")
        
        db.session.commit()
        logger.info(f"   ✅ Admin accounts ready")

        # 4. Summary
        logger.info("\n" + "="*60)
        logger.info("CONTENT POPULATION COMPLETE")
        logger.info("="*60)
        logger.info(f"Advisories:     {Advisory.query.count()}")
        logger.info(f"Market Prices:  {Market.query.count()}")
        logger.info(f"Total Users:    {User.query.count()}")
        logger.info("="*60)
        logger.info("\nAdmin Credentials:")
        for acc in admin_accounts:
            logger.info(f"  {acc['role']}: {acc['phone']} / {acc['password']}")
        logger.info("="*60)

if __name__ == '__main__':
    run()
