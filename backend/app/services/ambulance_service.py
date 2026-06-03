import random
import asyncio

class AmbulanceTrackingService:
    def __init__(self):
        self.active_ambulances = {} # driver_id -> {lat, lng, status}

    async def get_live_location(self, driver_id: int):
        """
        Simulates live GPS tracking.
        """
        if driver_id not in self.active_ambulances:
            # Initial random location (near a hospital)
            self.active_ambulances[driver_id] = {
                "lat": 40.7128 + random.uniform(-0.01, 0.01),
                "lng": -74.0060 + random.uniform(-0.01, 0.01),
                "status": "active"
            }
        
        # Simulate movement
        self.active_ambulances[driver_id]["lat"] += random.uniform(-0.0001, 0.0001)
        self.active_ambulances[driver_id]["lng"] += random.uniform(-0.0001, 0.0001)
        
        return self.active_ambulances[driver_id]

    async def find_nearest_ambulance(self, pickup_lat: float, pickup_lng: float):
        """
        AI Dispatch simulation: Finds the closest available ambulance.
        """
        # In a real app, this would use a spatial query (PostGIS)
        return {
            "driver_id": random.randint(100, 999),
            "estimated_arrival_mins": random.randint(5, 15),
            "vehicle_number": f"MED-{random.randint(1000, 9999)}"
        }

ambulance_service = AmbulanceTrackingService()
