"""
seed_data.py — Run with: python manage.py shell < seed_data.py

Seeds the database with:
  - Agent users across multiple cities
  - A spread of properties (Kolkata, Mumbai, Bangalore, Delhi, Hyderabad, Pune)
    covering different BHK configs, price bands, possession status, and
    verified/featured flags — enough variety to populate the homepage,
    filters, and locality pages realistically.
  - Locality records for the "Explore by locality" section.
  - Sample inquiries.
"""
from django.contrib.auth import get_user_model
from properties.models import Inquiry, Locality, Property, PropertyImage
from users.models import AgentProfile

User = get_user_model()

IMG = lambda seed: f"https://images.unsplash.com/{seed}?w=1200&q=80"

print("→ Creating agent users...")
AGENTS = [
    dict(email="agent@estatehub.com", username="agent_demo", first_name="Priya",
         last_name="Mehta", phone="+91 98300 00001", company="EstateHub Realty",
         bio="10+ years specialising in luxury residential properties across Kolkata.",
         years=10, license="WB-RE-2024-001", city="Kolkata"),
    dict(email="agent.mumbai@estatehub.com", username="agent_mumbai", first_name="Arjun",
         last_name="Kapoor", phone="+91 98200 11122", company="Skyline Properties",
         bio="Specialist in premium Mumbai & Pune residential launches.",
         years=8, license="MH-RE-2024-045", city="Mumbai"),
    dict(email="agent.bangalore@estatehub.com", username="agent_blr", first_name="Sneha",
         last_name="Rao", phone="+91 98450 33344", company="Prestige Homes Advisory",
         bio="Bangalore tech-corridor apartments and villas expert.",
         years=6, license="KA-RE-2024-089", city="Bangalore"),
]

agents = {}
for a in AGENTS:
    agent, created = User.objects.get_or_create(
        email=a["email"],
        defaults=dict(
            username=a["username"], first_name=a["first_name"], last_name=a["last_name"],
            role="agent", phone=a["phone"], is_active=True,
        ),
    )
    if created:
        agent.set_password("Agent@12345")
        agent.save()
    AgentProfile.objects.get_or_create(
        user=agent,
        defaults=dict(
            phone=a["phone"], company=a["company"], bio=a["bio"],
            years_of_experience=a["years"], specializations=["Residential", "New Launch"],
            license_number=a["license"],
        ),
    )
    agents[a["city"]] = agent
    print(f"   {'Created' if created else 'Exists'}: {agent.email}")

print("→ Creating localities...")
LOCALITIES = [
    ("New Alipore", "Kolkata", "West Bengal", 16500, IMG("photo-1558431382-27e303142255")),
    ("Salt Lake Sector V", "Kolkata", "West Bengal", 9200, IMG("photo-1477959858617-67f85cf4f1df")),
    ("Bandra West", "Mumbai", "Maharashtra", 42000, IMG("photo-1570168007204-dfb528c6958f")),
    ("Powai", "Mumbai", "Maharashtra", 21000, IMG("photo-1567157577867-05ccb1388e66")),
    ("Whitefield", "Bangalore", "Karnataka", 7800, IMG("photo-1596176530529-78163a4f7af2")),
    ("Indiranagar", "Bangalore", "Karnataka", 13500, IMG("photo-1580041065738-e72023775cdc")),
    ("Dwarka", "Delhi", "Delhi", 11200, IMG("photo-1587474260584-136574528ed5")),
    ("Gachibowli", "Hyderabad", "Telangana", 6900, IMG("photo-1519501025264-65ba15a82390")),
    ("Baner", "Pune", "Maharashtra", 8100, IMG("photo-1600585154340-be6161a56a0c")),
]
for name, city, state, avg_psf, img in LOCALITIES:
    Locality.objects.get_or_create(
        name=name, city=city,
        defaults=dict(state=state, avg_price_per_sqft=avg_psf, image_url=img,
                      description=f"{name} is one of {city}'s most sought-after residential micro-markets."),
    )
print(f"   {len(LOCALITIES)} localities ready")

print("→ Creating properties...")
PROPERTIES = [
    dict(
        slug="godrej-blue", title="Godrej Blue", agent_city="Kolkata",
        description=(
            "Godrej Blue is an ultra-luxury residential project by Godrej Properties, "
            "located on B.L. Saha Road, New Alipore, South Kolkata.\n\n"
            "Set on 7.44 acres with a 1-acre natural private pond, the project offers "
            "spacious 3 BHK and 4 BHK apartments designed for refined modern living. "
            "93% of units are Vaastu-compliant, 90% are lake & south-facing.\n\n"
            "The centrepiece is 'Club by The Calm Waters' — an exclusive aqua-themed clubhouse."
        ),
        property_type="sale", category="apartment", status="active",
        price=24000000, bhk=3, address="B.L. Saha Road, New Alipore", locality="New Alipore",
        city="Kolkata", state="West Bengal", zip_code="700053", latitude=22.5100, longitude=88.3300,
        beds=3, baths=3, area_sqft=1507, carpet_area_sqft=1210, lot_size_sqft=323863,
        year_built=2029, floors=20, garage_spaces=1,
        possession_status="under_construction", furnishing="unfurnished", transaction_type="new_booking",
        is_verified=True, is_featured=True,
        features=["1-acre private aqua arena and pond", "Club by The Calm Waters", "Infinity edge pool",
                  "Gymnasium", "Jogging track", "24/7 security and CCTV", "EV charging points", "Solar panels"],
        images=[IMG("photo-1545324418-cc1a3fa10c00"), IMG("photo-1580587771525-78b9dba3b914"),
                IMG("photo-1506905925346-21bda4d32df4"), IMG("photo-1631049307264-da0ec9d70304")],
        meta_description="Godrej Blue — Ultra-luxury 3 & 4 BHK apartments in New Alipore, South Kolkata.",
        listed_at="2024-11-01",
    ),
    dict(
        slug="lake-view-residency-salt-lake", title="Lake View Residency", agent_city="Kolkata",
        description="A ready-to-move 2 BHK apartment in Salt Lake Sector V, close to the IT corridor.",
        property_type="sale", category="apartment", status="active",
        price=6500000, bhk=2, address="Sector V, Salt Lake", locality="Salt Lake Sector V",
        city="Kolkata", state="West Bengal", zip_code="700091", latitude=22.5726, longitude=88.4310,
        beds=2, baths=2, area_sqft=980, carpet_area_sqft=810, year_built=2021, floors=12, garage_spaces=1,
        possession_status="ready_to_move", furnishing="semi_furnished", transaction_type="resale",
        is_verified=True, is_featured=False,
        features=["Lift", "Power backup", "24/7 water supply", "Covered parking"],
        images=[IMG("photo-1502672260266-1c1ef2d93688"), IMG("photo-1560448204-e02f11c3d0e2")],
        meta_description="Ready-to-move 2 BHK in Salt Lake Sector V, Kolkata.",
        listed_at="2025-02-10",
    ),
    dict(
        slug="skyline-heights-bandra", title="Skyline Heights", agent_city="Mumbai",
        description="A premium sea-facing 3 BHK apartment in the heart of Bandra West.",
        property_type="sale", category="apartment", status="active",
        price=95000000, bhk=3, address="Carter Road, Bandra West", locality="Bandra West",
        city="Mumbai", state="Maharashtra", zip_code="400050", latitude=19.0596, longitude=72.8295,
        beds=3, baths=3, area_sqft=1850, carpet_area_sqft=1480, year_built=2023, floors=30, garage_spaces=2,
        possession_status="ready_to_move", furnishing="fully_furnished", transaction_type="resale",
        is_verified=True, is_featured=True,
        features=["Sea view", "Private terrace", "Clubhouse", "Infinity pool", "Concierge", "Home theatre"],
        images=[IMG("photo-1613977257363-707ba9348227"), IMG("photo-1512917774080-9991f1c4c750")],
        meta_description="Sea-facing 3 BHK in Bandra West, Mumbai — fully furnished.",
        listed_at="2025-01-20",
    ),
    dict(
        slug="hiranandani-gardens-powai", title="Hiranandani Gardens 2BHK", agent_city="Mumbai",
        description="Spacious 2 BHK in the well-established Hiranandani Gardens complex, Powai.",
        property_type="rent", category="apartment", status="active",
        price=65000, bhk=2, address="Hiranandani Gardens, Powai", locality="Powai",
        city="Mumbai", state="Maharashtra", zip_code="400076", latitude=19.1176, longitude=72.9060,
        beds=2, baths=2, area_sqft=1100, carpet_area_sqft=920, year_built=2010, floors=18, garage_spaces=1,
        possession_status="ready_to_move", furnishing="semi_furnished", transaction_type="resale",
        is_verified=False, is_featured=False,
        features=["Lake view", "Gym", "Swimming pool", "24/7 security"],
        images=[IMG("photo-1522708323590-d24dbb6b0267")],
        meta_description="2 BHK for rent in Hiranandani Gardens, Powai, Mumbai.",
        listed_at="2025-03-05",
    ),
    dict(
        slug="brigade-tech-park-whitefield", title="Brigade Meadows 3BHK", agent_city="Bangalore",
        description="Modern 3 BHK apartment close to the Whitefield tech corridor.",
        property_type="sale", category="apartment", status="active",
        price=8900000, bhk=3, address="ITPL Main Road, Whitefield", locality="Whitefield",
        city="Bangalore", state="Karnataka", zip_code="560066", latitude=12.9698, longitude=77.7500,
        beds=3, baths=2, area_sqft=1450, carpet_area_sqft=1180, year_built=2022, floors=15, garage_spaces=1,
        possession_status="ready_to_move", furnishing="unfurnished", transaction_type="resale",
        is_verified=True, is_featured=True,
        features=["Clubhouse", "Kids play area", "Jogging track", "Solar power", "Rainwater harvesting"],
        images=[IMG("photo-1580587771525-78b9dba3b914"), IMG("photo-1600607687939-ce8a6c25118c")],
        meta_description="3 BHK apartment in Whitefield, Bangalore, near tech parks.",
        listed_at="2025-01-12",
    ),
    dict(
        slug="indiranagar-boutique-villa", title="Indiranagar Boutique Villa", agent_city="Bangalore",
        description="An independent 4 BHK villa with a private garden in leafy Indiranagar.",
        property_type="sale", category="house", status="active",
        price=42000000, bhk=4, address="12th Main, Indiranagar", locality="Indiranagar",
        city="Bangalore", state="Karnataka", zip_code="560038", latitude=12.9784, longitude=77.6408,
        beds=4, baths=4, area_sqft=3200, carpet_area_sqft=2600, year_built=2019, floors=3, garage_spaces=2,
        possession_status="ready_to_move", furnishing="fully_furnished", transaction_type="resale",
        is_verified=True, is_featured=False,
        features=["Private garden", "Home office", "Modular kitchen", "Servant quarters"],
        images=[IMG("photo-1568605114967-8130f3a36994")],
        meta_description="4 BHK independent villa in Indiranagar, Bangalore.",
        listed_at="2024-12-02",
    ),
    dict(
        slug="dwarka-new-launch-2bhk", title="Dwarka Elegance", agent_city="Kolkata",
        description="Affordable new-launch 2 BHK in Dwarka, close to the metro station.",
        property_type="sale", category="apartment", status="active",
        price=5800000, bhk=2, address="Sector 12, Dwarka", locality="Dwarka",
        city="Delhi", state="Delhi", zip_code="110078", latitude=28.5921, longitude=77.0460,
        beds=2, baths=2, area_sqft=950, carpet_area_sqft=780, year_built=2027, floors=14, garage_spaces=1,
        possession_status="under_construction", furnishing="unfurnished", transaction_type="new_booking",
        is_verified=False, is_featured=False,
        features=["Metro connectivity", "Clubhouse", "Power backup"],
        images=[IMG("photo-1502005229762-cf1b2da7c5d6")],
        meta_description="New-launch 2 BHK in Dwarka, Delhi.",
        listed_at="2025-03-20",
    ),
    dict(
        slug="gachibowli-tech-suites", title="Gachibowli Tech Suites", agent_city="Bangalore",
        description="Ready-to-move 3 BHK apartment in Gachibowli, minutes from the financial district.",
        property_type="rent", category="apartment", status="active",
        price=42000, bhk=3, address="Nanakramguda Road, Gachibowli", locality="Gachibowli",
        city="Hyderabad", state="Telangana", zip_code="500032", latitude=17.4401, longitude=78.3489,
        beds=3, baths=2, area_sqft=1550, carpet_area_sqft=1280, year_built=2020, floors=22, garage_spaces=1,
        possession_status="ready_to_move", furnishing="semi_furnished", transaction_type="resale",
        is_verified=True, is_featured=False,
        features=["Gym", "Swimming pool", "Co-working lounge", "24/7 security"],
        images=[IMG("photo-1493809842364-78817add7ffb")],
        meta_description="3 BHK for rent in Gachibowli, Hyderabad.",
        listed_at="2025-02-25",
    ),
    dict(
        slug="baner-riverside-1bhk", title="Baner Riverside Studio", agent_city="Mumbai",
        description="Compact 1 BHK ideal for young professionals, close to Baner IT hub.",
        property_type="sale", category="apartment", status="active",
        price=4200000, bhk=1, address="Baner Road", locality="Baner",
        city="Pune", state="Maharashtra", zip_code="411045", latitude=18.5642, longitude=73.7769,
        beds=1, baths=1, area_sqft=620, carpet_area_sqft=510, year_built=2023, floors=10, garage_spaces=1,
        possession_status="ready_to_move", furnishing="unfurnished", transaction_type="resale",
        is_verified=False, is_featured=False,
        features=["Riverside view", "Gym", "Lift"],
        images=[IMG("photo-1493809842364-78817add7ffb")],
        meta_description="1 BHK apartment in Baner, Pune.",
        listed_at="2025-03-01",
    ),
]

created_props = []
for p in PROPERTIES:
    images = p.pop("images")
    agent_city = p.pop("agent_city")
    prop, created = Property.objects.get_or_create(
        slug=p.pop("slug"),
        defaults={**p, "agent": agents[agent_city]},
    )
    if created:
        for i, url in enumerate(images):
            PropertyImage.objects.create(
                property=prop, image_url=url, is_primary=(i == 0), order=i,
            )
    created_props.append(prop)
    print(f"   {'Created' if created else 'Exists'}: {prop.title} (/{prop.slug})")

# Sample inquiry on the flagship listing
flagship = created_props[0]
if not flagship.inquiries.exists():
    Inquiry.objects.create(
        property=flagship,
        name="Rahul Sharma",
        email="rahul.sharma@gmail.com",
        phone="+91 98300 12345",
        message="Interested in 3 BHK. Can I schedule a site visit this weekend? Please share the price for a lake-facing unit on the 15th floor.",
        status="new",
    )
    print("   Added: 1 sample inquiry")

print("\n✓ Seed complete!")
print("  Admin:    http://localhost:8000/admin/")
print("  API:      http://localhost:8000/api/properties/")
print("  Website:  http://localhost:3000/properties/godrej-blue")
print("\n  Agent logins (password: Agent@12345):")
for a in AGENTS:
    print(f"    {a['email']}  ({a['city']})")
