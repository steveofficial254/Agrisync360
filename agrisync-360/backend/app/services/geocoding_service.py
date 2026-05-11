"""
Geocoding service for Kenyan counties and sub-counties
Provides automatic latitude/longitude coordinates based on location names
"""

import logging
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

class GeocodingService:
    """Service for geocoding Kenyan administrative divisions"""
    
    # Kenya county coordinates (approximate centers)
    COUNTY_COORDINATES = {
        # Nairobi Region
        "Nairobi": (-1.2921, 36.8219),
        
        # Central Region
        "Kiambu": (-1.1633, 36.8382),
        "Kirinyaga": (-0.4833, 37.2833),
        "Murang'a": (-0.7167, 37.1500),
        "Nyandarua": (-0.3167, 36.4833),
        "Nyeri": (-0.4167, 37.0333),
        
        # Coast Region
        "Kilifi": (-3.6333, 39.8500),
        "Kwale": (-4.2833, 39.4667),
        "Lamu": (-2.2667, 40.9000),
        "Mombasa": (-4.0500, 39.6667),
        "Taita Taveta": (-3.4167, 38.3833),
        "Tana River": (-1.5167, 40.1333),
        
        # Eastern Region
        "Embu": (-0.5333, 37.4500),
        "Garissa": (-0.4667, 39.6500),
        "Isiolo": (0.3500, 37.5833),
        "Kitui": (-1.5167, 38.0167),
        "Machakos": (-1.5167, 37.2667),
        "Makueni": (-1.8000, 37.6167),
        "Marsabit": (2.2833, 37.9833),
        "Meru": (0.0467, 37.6567),
        "Tharaka Nithi": (-0.2833, 37.6833),
        
        # North Eastern Region
        "Mandera": (3.9333, 41.8500),
        "Wajir": (1.7500, 40.0500),
        
        # Nyanza Region
        "Homa Bay": (-0.5167, 34.5167),
        "Kisii": (-0.6833, 34.7667),
        "Kisumu": (-0.1167, 34.7500),
        "Migori": (-1.0667, 34.8167),
        "Nyamira": (-0.5667, 35.0833),
        "Siaya": (0.0667, 34.3000),
        
        # Rift Valley Region
        "Baringo": (0.5167, 35.9500),
        "Bomet": (-0.7833, 35.3500),
        "Bungoma": (0.5633, 34.5600),
        "Elgeyo Marakwet": (0.9833, 35.6167),
        "Kajiado": (-2.1667, 36.7833),
        "Kakamega": (0.2833, 34.7500),
        "Kericho": (-0.3667, 35.2833),
        "Laikipia": (0.1000, 36.7000),
        "Nakuru": (-0.2833, 36.0667),
        "Nandi": (0.1333, 35.0833),
        "Narok": (-1.0833, 35.8500),
        "Samburu": (1.2167, 37.7500),
        "Trans Nzoia": (1.0167, 35.2000),
        "Turkana": (3.0833, 35.6000),
        "Uasin Gishu": (0.5167, 35.2833),
        "Vihiga": (0.0500, 34.6500),
        "West Pokot": (1.4167, 35.1167),
        
        # Western Region
        "Busia": (0.4667, 34.1167),
        "Vihiga": (0.0500, 34.6500),  # Also in Rift Valley
    }
    
    # Sub-county coordinate offsets (for more precise location)
    SUB_COUNTY_OFFSETS = {
        # Common sub-county patterns with approximate offsets
        "central": (0.0, 0.0),
        "north": (0.1, 0.0),
        "south": (-0.1, 0.0),
        "east": (0.0, 0.1),
        "west": (0.0, -0.1),
        "town": (0.0, 0.0),
        "division": (0.0, 0.0),
    }
    
    @classmethod
    def get_coordinates_for_county(cls, county: str) -> Optional[Tuple[float, float]]:
        """
        Get latitude and longitude for a Kenyan county
        
        Args:
            county: County name (case-insensitive)
            
        Returns:
            Tuple of (latitude, longitude) or None if not found
        """
        if not county:
            return None
            
        # Normalize county name
        county_normalized = county.strip().title()
        
        # Handle common variations
        county_mapping = {
            "Nairobi City": "Nairobi",
            "Mombasa City": "Mombasa",
            "Kisumu City": "Kisumu",
            "Nakuru Town": "Nakuru",
            "Eldoret": "Uasin Gishu",
            "Thika": "Kiambu",
        }
        
        county_normalized = county_mapping.get(county_normalized, county_normalized)
        
        coordinates = cls.COUNTY_COORDINATES.get(county_normalized)
        
        if coordinates:
            logger.debug(f"Found coordinates for {county}: {coordinates}")
            return coordinates
            
        logger.warning(f"No coordinates found for county: {county}")
        return None
    
    @classmethod
    def get_coordinates_for_location(cls, county: str, sub_county: str = None) -> Optional[Tuple[float, float]]:
        """
        Get coordinates for a specific location (county + sub-county)
        
        Args:
            county: County name
            sub_county: Sub-county name (optional)
            
        Returns:
            Tuple of (latitude, longitude) or None if not found
        """
        # Get base county coordinates
        county_coords = cls.get_coordinates_for_county(county)
        if not county_coords:
            return None
            
        lat, lon = county_coords
        
        # Apply sub-county offset if provided
        if sub_county:
            offset = cls._get_sub_county_offset(sub_county)
            lat += offset[0]
            lon += offset[1]
            logger.debug(f"Applied sub-county offset for {sub_county}: {offset}")
        
        return (lat, lon)
    
    @classmethod
    def _get_sub_county_offset(cls, sub_county: str) -> Tuple[float, float]:
        """
        Get coordinate offset for a sub-county
        
        Args:
            sub_county: Sub-county name
            
        Returns:
            Tuple of (lat_offset, lon_offset)
        """
        if not sub_county:
            return (0.0, 0.0)
            
        sub_county_lower = sub_county.lower()
        
        # Check for directional indicators
        for pattern, offset in cls.SUB_COUNTY_OFFSETS.items():
            if pattern in sub_county_lower:
                return offset
        
        # Default small random offset for uniqueness
        import random
        return (random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05))
    
    @classmethod
    def validate_coordinates(cls, lat: float, lon: float) -> bool:
        """
        Validate if coordinates are within Kenya bounds
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            True if coordinates are valid for Kenya
        """
        # Kenya approximate bounds
        KENYA_BOUNDS = {
            "min_lat": -4.68,
            "max_lat": 5.05,
            "min_lon": 33.91,
            "max_lon": 41.91
        }
        
        return (KENYA_BOUNDS["min_lat"] <= lat <= KENYA_BOUNDS["max_lat"] and
                KENYA_BOUNDS["min_lon"] <= lon <= KENYA_BOUNDS["max_lon"])
    
    @classmethod
    def get_all_counties(cls) -> list:
        """
        Get list of all supported counties
        
        Returns:
            List of county names
        """
        return list(cls.COUNTY_COORDINATES.keys())
