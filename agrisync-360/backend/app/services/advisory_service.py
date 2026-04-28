from datetime import timedelta

from app.models.advisory import Advisory


class AdvisoryService:
    @staticmethod
    def get_crop_advisory(crop_name, county, growth_stage):
        q = Advisory.query.filter_by(crop_name=crop_name, is_active=True)
        if growth_stage:
            q = q.filter((Advisory.growth_stage == growth_stage) | (Advisory.growth_stage.is_(None)))
        rows = q.order_by(Advisory.advisory_type.asc()).all()
        data = []
        for row in rows:
            if row.counties_applicable and county and county not in row.counties_applicable:
                continue
            data.append(row.to_dict())
        return data

    @staticmethod
    def get_planting_calendar(crop_name, planting_date, county):
        _ = county
        base = [
            (1, "Land prep and seed selection", "Soil moisture", "Certified seed"),
            (2, "Planting and gap filling", "Emergence rate", "DAP/NPK"),
            (4, "Top dressing", "Nitrogen deficiency", "CAN/Urea"),
            (6, "Pest scouting", "Armyworm/aphids", "Recommended pesticide"),
            (10, "Harvest prep", "Maturity indicators", "Storage bags"),
        ]
        return [
            {
                "week": w,
                "date": (planting_date + timedelta(days=(w - 1) * 7)).isoformat(),
                "crop": crop_name,
                "task": task,
                "watch_for": watch,
                "inputs_needed": inputs,
            }
            for w, task, watch, inputs in base
        ]

    @staticmethod
    def get_disease_alert(crop_name, weather_risk, county):
        _ = county
        if weather_risk not in ["high", "very_high"]:
            return []
        return [{"crop": crop_name, "risk": weather_risk, "threat": "Fungal disease outbreak", "action": "Spray preventive fungicide and improve airflow."}]

    @staticmethod
    def get_nutrition_guide(crop_name, growth_stage):
        stage_map = {
            "planting": {"N": 20, "P": 20, "K": 10},
            "vegetative": {"N": 30, "P": 10, "K": 20},
            "flowering": {"N": 15, "P": 10, "K": 30},
        }
        npk = stage_map.get(growth_stage or "vegetative", stage_map["vegetative"])
        return {"crop": crop_name, "stage": growth_stage, "npk": npk, "recommended_products": ["NPK 23:23:0", "CAN"]}
