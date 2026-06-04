"""
AgriSync 360 — Comprehensive Backend Integration Tests
Covers: Auth, Profiles, Farms, Crops, Weather, Advisory, Market, Payments,
        AI Chat, Greenhouses, Yields, Farm Ops, Inventory, Batches, Compliance,
        Financial, Farm Intelligence, Community, Market Pro, Admin, Dealer,
        NGO, USSD, SMS, WhatsApp, and role-based access control.
"""
import pytest

# ─────────────────────────────────────────────────────────────────────────────
# 1. HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200

    def test_health_success_flag(self, client):
        data = client.get("/api/health").get_json()
        assert data["success"] is True

    def test_health_has_status_key(self, client):
        data = client.get("/api/health").get_json()
        assert "status" in data["data"]

    def test_farms_health(self, client):
        r = client.get("/api/farms/health")
        assert r.status_code == 200
        assert r.get_json()["success"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 2. AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────────

class TestAuthentication:
    PHONE = "0712300001"
    PASS = "TestPass1!"

    def _register(self, client, phone=None, role="farmer"):
        return client.post("/api/auth/register", json={
            "phone": phone or self.PHONE,
            "password": self.PASS,
            "role": role
        })

    def test_register_new_farmer(self, client):
        r = self._register(client, phone="0712300100")
        assert r.status_code in [200, 201]
        assert r.get_json()["success"] is True

    def test_register_returns_otp_in_dev(self, client):
        r = self._register(client, phone="0712300101")
        assert r.get_json()["data"]["otp"] is not None

    def test_register_duplicate_phone_returns_409(self, client):
        self._register(client, phone="0712300102")
        r = self._register(client, phone="0712300102")
        assert r.status_code == 409

    def test_register_invalid_role_returns_400(self, client):
        r = client.post("/api/auth/register", json={
            "phone": "0712300103", "password": self.PASS, "role": "supervillain"
        })
        assert r.status_code == 400

    def test_register_missing_phone_returns_400(self, client):
        r = client.post("/api/auth/register", json={"password": self.PASS, "role": "farmer"})
        assert r.status_code == 400

    def test_verify_otp_activates_account(self, client):
        r = self._register(client, phone="0712300104")
        otp = r.get_json()["data"]["otp"]
        r2 = client.post("/api/auth/verify-otp", json={"phone": "0712300104", "otp": str(otp)})
        assert r2.status_code == 200
        assert "access_token" in r2.get_json()["data"]

    def test_verify_otp_wrong_code_returns_400(self, client):
        self._register(client, phone="0712300105")
        r = client.post("/api/auth/verify-otp", json={"phone": "0712300105", "otp": "000000"})
        assert r.status_code == 400

    def test_login_valid_credentials(self, client):
        r = self._register(client, phone="0712300106")
        otp = r.get_json()["data"]["otp"]
        client.post("/api/auth/verify-otp", json={"phone": "0712300106", "otp": str(otp)})
        r2 = client.post("/api/auth/login", json={"phone": "0712300106", "password": self.PASS})
        assert r2.status_code == 200
        assert "access_token" in r2.get_json()["data"]
        assert "refresh_token" in r2.get_json()["data"]

    def test_login_wrong_password_returns_401(self, client):
        r = self._register(client, phone="0712300107")
        otp = r.get_json()["data"]["otp"]
        client.post("/api/auth/verify-otp", json={"phone": "0712300107", "otp": str(otp)})
        r2 = client.post("/api/auth/login", json={"phone": "0712300107", "password": "WrongPass!"})
        assert r2.status_code == 401

    def test_login_unverified_user_blocked(self, client):
        self._register(client, phone="0712300108")  # do NOT verify
        r = client.post("/api/auth/login", json={"phone": "0712300108", "password": self.PASS})
        assert r.status_code in [401, 403]

    def test_logout_valid_token(self, client, auth_header):
        r = client.post("/api/auth/logout", headers=auth_header)
        assert r.status_code == 200

    def test_logout_without_token_returns_401(self, client):
        r = client.post("/api/auth/logout")
        assert r.status_code == 401

    def test_refresh_token(self, client):
        r = self._register(client, phone="0712300109")
        otp = r.get_json()["data"]["otp"]
        r2 = client.post("/api/auth/verify-otp", json={"phone": "0712300109", "otp": str(otp)})
        refresh_token = r2.get_json()["data"]["refresh_token"]
        r3 = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"})
        assert r3.status_code == 200
        assert "access_token" in r3.get_json()["data"]

    def test_resend_otp(self, client):
        self._register(client, phone="0712300110")
        r = client.post("/api/auth/resend-otp", json={
            "phone": "0712300110", "otp_type": "phone_verification"
        })
        assert r.status_code == 200

    def test_forgot_password_sends_otp(self, client):
        r = self._register(client, phone="0712300111")
        otp = r.get_json()["data"]["otp"]
        client.post("/api/auth/verify-otp", json={"phone": "0712300111", "otp": str(otp)})
        r2 = client.post("/api/auth/forgot-password", json={"phone": "0712300111"})
        assert r2.status_code == 200
        assert "otp" in r2.get_json()["data"]

    def test_forgot_password_unknown_phone_returns_404(self, client):
        r = client.post("/api/auth/forgot-password", json={"phone": "0799999111"})
        assert r.status_code == 404

    def test_full_password_reset_flow(self, client):
        # Register + verify
        r = self._register(client, phone="0712300112")
        otp = r.get_json()["data"]["otp"]
        client.post("/api/auth/verify-otp", json={"phone": "0712300112", "otp": str(otp)})
        # Forgot
        r2 = client.post("/api/auth/forgot-password", json={"phone": "0712300112"})
        reset_otp = r2.get_json()["data"]["otp"]
        # Verify reset OTP
        r3 = client.post("/api/auth/verify-reset-otp", json={
            "phone": "0712300112", "otp": str(reset_otp)
        })
        assert r3.status_code == 200
        reset_token = r3.get_json()["data"]["reset_token"]
        # Reset password
        r4 = client.post("/api/auth/reset-password", json={
            "reset_token": reset_token, "new_password": "NewPass99!"
        })
        assert r4.status_code == 200
        # Login with new password
        r5 = client.post("/api/auth/login", json={"phone": "0712300112", "password": "NewPass99!"})
        assert r5.status_code == 200

    def test_verify_reset_otp_wrong_code_returns_400(self, client):
        r = self._register(client, phone="0712300113")
        otp = r.get_json()["data"]["otp"]
        client.post("/api/auth/verify-otp", json={"phone": "0712300113", "otp": str(otp)})
        client.post("/api/auth/forgot-password", json={"phone": "0712300113"})
        r2 = client.post("/api/auth/verify-reset-otp", json={"phone": "0712300113", "otp": "000000"})
        assert r2.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# 3. ROLE-BASED ACCESS CONTROL
# ─────────────────────────────────────────────────────────────────────────────

class TestRoleBasedAccessControl:
    def test_no_token_returns_401(self, client):
        r = client.get("/api/farmers/profile")
        assert r.status_code == 401

    def test_farmer_blocked_from_admin_stats(self, client, auth_header):
        r = client.get("/api/admin/stats", headers=auth_header)
        assert r.status_code == 403

    def test_farmer_blocked_from_dealer_profile(self, client, auth_header):
        r = client.get("/api/dealer/profile", headers=auth_header)
        assert r.status_code == 403

    def test_farmer_blocked_from_ngo_profile(self, client, auth_header):
        r = client.get("/api/ngo/profile", headers=auth_header)
        assert r.status_code == 403

    def test_admin_can_access_admin_stats(self, client, admin_auth_header):
        r = client.get("/api/admin/stats", headers=admin_auth_header)
        assert r.status_code == 200

    def test_dealer_can_access_dealer_profile_endpoint(self, client, dealer_auth_header):
        # Profile does not exist yet, but should get 404 not 403
        r = client.get("/api/dealer/profile", headers=dealer_auth_header)
        assert r.status_code in [200, 404]

    def test_ngo_can_access_ngo_profile_endpoint(self, client, ngo_auth_header):
        r = client.get("/api/ngo/profile", headers=ngo_auth_header)
        assert r.status_code in [200, 404]

    def test_farmer_blocked_from_sms_logs(self, client, auth_header):
        r = client.get("/api/sms/logs", headers=auth_header)
        assert r.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# 4. FARMER PROFILES
# ─────────────────────────────────────────────────────────────────────────────

class TestFarmerProfiles:
    def test_get_profile(self, client, auth_header):
        r = client.get("/api/farmers/profile", headers=auth_header)
        assert r.status_code == 200
        data = r.get_json()["data"]
        assert data["first_name"] == "Test"
        assert data["last_name"] == "Farmer"
        assert data["county"] == "Nairobi"

    def test_update_profile_name(self, client, auth_header):
        r = client.put("/api/farmers/profile", json={"first_name": "Jane"}, headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["first_name"] == "Jane"

    def test_update_profile_county(self, client, auth_header):
        r = client.put("/api/farmers/profile", json={"county": "Nakuru"}, headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["county"] == "Nakuru"

    def test_profile_without_token_returns_401(self, client):
        r = client.get("/api/farmers/profile")
        assert r.status_code == 401

    def test_admin_list_farmers(self, client, admin_auth_header):
        r = client.get("/api/farmers/", headers=admin_auth_header)
        assert r.status_code == 200
        assert r.get_json()["success"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 5. FARMS & CROPS
# ─────────────────────────────────────────────────────────────────────────────

class TestFarmsAndCrops:
    FARM_PAYLOAD = {
        "name": "Test Farm Kilifi",
        "latitude": -3.51,
        "longitude": 39.85,
        "county": "Kilifi",
        "size_acres": 8.0,
        "soil_type": "sandy",
        "water_source": "rain"
    }

    def _create_farm(self, client, auth_header):
        return client.post("/api/farms/", json=self.FARM_PAYLOAD, headers=auth_header)

    def test_create_farm_returns_201(self, client, auth_header):
        r = self._create_farm(client, auth_header)
        assert r.status_code == 201

    def test_create_farm_data_structure(self, client, auth_header):
        r = self._create_farm(client, auth_header)
        d = r.get_json()["data"]
        assert d["name"] == "Test Farm Kilifi"
        assert d["county"] == "Kilifi"
        assert d["soil_type"] == "sandy"

    def test_first_farm_is_primary(self, client, auth_header):
        r = self._create_farm(client, auth_header)
        assert r.get_json()["data"]["is_primary"] is True

    def test_create_farm_invalid_soil_returns_400(self, client, auth_header):
        bad = {**self.FARM_PAYLOAD, "soil_type": "volcanic"}
        r = client.post("/api/farms/", json=bad, headers=auth_header)
        assert r.status_code == 400

    def test_create_farm_invalid_water_source_returns_400(self, client, auth_header):
        bad = {**self.FARM_PAYLOAD, "water_source": "cloud"}
        r = client.post("/api/farms/", json=bad, headers=auth_header)
        assert r.status_code == 400

    def test_create_farm_invalid_county_returns_400(self, client, auth_header):
        bad = {**self.FARM_PAYLOAD, "county": "Narnia"}
        r = client.post("/api/farms/", json=bad, headers=auth_header)
        assert r.status_code == 400

    def test_create_farm_missing_required_field_returns_400(self, client, auth_header):
        incomplete = {k: v for k, v in self.FARM_PAYLOAD.items() if k != "name"}
        r = client.post("/api/farms/", json=incomplete, headers=auth_header)
        assert r.status_code == 400

    def test_list_farms(self, client, auth_header):
        self._create_farm(client, auth_header)
        r = client.get("/api/farms/", headers=auth_header)
        assert r.status_code == 200
        assert isinstance(r.get_json()["data"], list)
        assert len(r.get_json()["data"]) >= 1

    def test_get_farm_by_id(self, client, auth_header):
        farm_id = self._create_farm(client, auth_header).get_json()["data"]["id"]
        r = client.get(f"/api/farms/{farm_id}", headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["id"] == farm_id

    def test_get_nonexistent_farm_returns_404(self, client, auth_header):
        r = client.get("/api/farms/00000000-0000-0000-0000-000000000000", headers=auth_header)
        assert r.status_code == 404

    def test_update_farm_name(self, client, auth_header):
        farm_id = self._create_farm(client, auth_header).get_json()["data"]["id"]
        r = client.put(f"/api/farms/{farm_id}", json={"name": "Renamed Farm"}, headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["name"] == "Renamed Farm"

    def test_update_farm_size(self, client, auth_header):
        farm_id = self._create_farm(client, auth_header).get_json()["data"]["id"]
        r = client.put(f"/api/farms/{farm_id}", json={"size_acres": 12.5}, headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["size_acres"] == 12.5

    def test_delete_farm(self, client, auth_header):
        farm_id = self._create_farm(client, auth_header).get_json()["data"]["id"]
        r = client.delete(f"/api/farms/{farm_id}", headers=auth_header)
        assert r.status_code == 200
        # Confirm it's gone
        r2 = client.get(f"/api/farms/{farm_id}", headers=auth_header)
        assert r2.status_code == 404

    # ── Crops ──

    def _create_farm_and_crop(self, client, auth_header):
        farm_id = self._create_farm(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/farms/{farm_id}/crops", json={
            "crop_name": "maize",
            "planting_date": "2026-04-01",
            "area_planted_acres": 3.0
        }, headers=auth_header)
        return farm_id, r

    def test_add_crop_returns_201(self, client, auth_header):
        _, r = self._create_farm_and_crop(client, auth_header)
        assert r.status_code == 201

    def test_add_crop_data(self, client, auth_header):
        _, r = self._create_farm_and_crop(client, auth_header)
        d = r.get_json()["data"]
        assert d["crop_name"] == "maize"
        assert d["area_planted_acres"] == 3.0

    def test_add_crop_invalid_name_returns_400(self, client, auth_header):
        farm_id = self._create_farm(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/farms/{farm_id}/crops", json={
            "crop_name": "avocado",  # not in allowed list
            "planting_date": "2026-04-01",
            "area_planted_acres": 2.0
        }, headers=auth_header)
        assert r.status_code == 400

    def test_add_crop_exceeds_farm_size_returns_400(self, client, auth_header):
        farm_id = self._create_farm(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/farms/{farm_id}/crops", json={
            "crop_name": "beans",
            "planting_date": "2026-04-01",
            "area_planted_acres": 999.0   # exceeds 8 acre farm
        }, headers=auth_header)
        assert r.status_code == 400

    def test_list_crops(self, client, auth_header):
        farm_id, _ = self._create_farm_and_crop(client, auth_header)
        r = client.get(f"/api/farms/{farm_id}/crops", headers=auth_header)
        assert r.status_code == 200
        assert len(r.get_json()["data"]) >= 1

    def test_update_crop_growth_stage(self, client, auth_header):
        farm_id, cr = self._create_farm_and_crop(client, auth_header)
        crop_id = cr.get_json()["data"]["id"]
        r = client.put(f"/api/farms/{farm_id}/crops/{crop_id}",
                       json={"growth_stage": "flowering"}, headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["growth_stage"] == "flowering"

    def test_update_crop_invalid_stage_returns_400(self, client, auth_header):
        farm_id, cr = self._create_farm_and_crop(client, auth_header)
        crop_id = cr.get_json()["data"]["id"]
        r = client.put(f"/api/farms/{farm_id}/crops/{crop_id}",
                       json={"growth_stage": "eating"}, headers=auth_header)
        assert r.status_code == 400

    def test_delete_crop(self, client, auth_header):
        farm_id, cr = self._create_farm_and_crop(client, auth_header)
        crop_id = cr.get_json()["data"]["id"]
        r = client.delete(f"/api/farms/{farm_id}/crops/{crop_id}", headers=auth_header)
        assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 6. WEATHER
# ─────────────────────────────────────────────────────────────────────────────

class TestWeather:
    LAT, LON = -1.29, 36.82

    def test_forecast_returns_200(self, client):
        r = client.get(f"/api/weather/forecast?lat={self.LAT}&lon={self.LON}")
        assert r.status_code == 200
        assert r.get_json()["success"] is True

    def test_forecast_missing_params_returns_400(self, client):
        r = client.get("/api/weather/forecast")
        assert r.status_code == 400

    def test_current_weather(self, client):
        r = client.get(f"/api/weather/current?lat={self.LAT}&lon={self.LON}")
        assert r.status_code == 200

    def test_disease_risk(self, client):
        r = client.get(f"/api/weather/disease-risk?lat={self.LAT}&lon={self.LON}&crop=maize")
        assert r.status_code == 200
        assert r.get_json()["success"] is True

    def test_planting_window(self, client):
        r = client.get(f"/api/weather/planting-window?lat={self.LAT}&lon={self.LON}")
        assert r.status_code == 200

    def test_historical_weather(self, client):
        r = client.get(f"/api/weather/historical?lat={self.LAT}&lon={self.LON}&crop=maize")
        assert r.status_code == 200

    def test_seasonal_weather(self, client):
        r = client.get("/api/weather/seasonal?county=Nairobi")
        assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 7. CROP ADVISORY
# ─────────────────────────────────────────────────────────────────────────────

class TestAdvisory:
    def test_crop_advisory_maize(self, client):
        r = client.get("/api/advisory/crop/maize")
        assert r.status_code == 200
        assert r.get_json()["success"] is True

    def test_crop_advisory_beans(self, client):
        r = client.get("/api/advisory/crop/beans")
        assert r.status_code == 200

    def test_crop_advisory_invalid_crop(self, client):
        r = client.get("/api/advisory/crop/mystery_crop")
        # Either returns empty list or 404 — both acceptable
        assert r.status_code in [200, 404]

    def test_planting_calendar_requires_jwt(self, client):
        r = client.get("/api/advisory/calendar/maize")
        assert r.status_code == 401

    def test_planting_calendar_with_jwt(self, client, auth_header):
        r = client.get("/api/advisory/calendar/maize", headers=auth_header)
        assert r.status_code == 200

    def test_pests_advisory_requires_jwt(self, client):
        r = client.get("/api/advisory/pests/maize")
        assert r.status_code == 401

    def test_pests_advisory_with_jwt(self, client, auth_header):
        r = client.get("/api/advisory/pests/maize", headers=auth_header)
        assert r.status_code == 200

    def test_my_crops_advisory(self, client, auth_header):
        r = client.get("/api/advisory/my-crops", headers=auth_header)
        assert r.status_code == 200

    def test_admin_list_advisory(self, client, admin_auth_header):
        r = client.get("/api/advisory/admin", headers=admin_auth_header)
        assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 8. MARKET PRICES
# ─────────────────────────────────────────────────────────────────────────────

class TestMarket:
    def test_market_prices_public(self, client):
        r = client.get("/api/market/prices")
        assert r.status_code == 200
        assert r.get_json()["success"] is True

    def test_market_prices_all(self, client):
        r = client.get("/api/market/prices/all")
        assert r.status_code == 200

    def test_market_prices_filter_by_crop(self, client):
        r = client.get("/api/market/prices?crop=maize")
        assert r.status_code == 200

    def test_market_prices_filter_by_county(self, client):
        r = client.get("/api/market/prices?county=Nakuru")
        assert r.status_code == 200

    def test_market_history(self, client):
        r = client.get("/api/market/history?crop=maize")
        assert r.status_code == 200

    def test_market_profitability(self, client):
        r = client.get("/api/market/profitability?crop=maize&acres=2&county=Nakuru")
        assert r.status_code == 200
        data = r.get_json()
        assert data["success"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 9. PAYMENTS & SUBSCRIPTIONS
# ─────────────────────────────────────────────────────────────────────────────

class TestPayments:
    def test_list_plans_public(self, client):
        r = client.get("/api/payments/plans")
        assert r.status_code == 200
        plans = r.get_json()["data"]
        assert len(plans) >= 2

    def test_plan_basic_monthly_exists(self, client):
        plans = client.get("/api/payments/plans").get_json()["data"]
        ids = [p["plan_id"] for p in plans]
        assert "basic_monthly" in ids

    def test_plan_pro_monthly_exists(self, client):
        plans = client.get("/api/payments/plans").get_json()["data"]
        ids = [p["plan_id"] for p in plans]
        assert "pro_monthly" in ids

    def test_basic_monthly_price_is_99(self, client):
        plans = client.get("/api/payments/plans").get_json()["data"]
        basic = next(p for p in plans if p["plan_id"] == "basic_monthly")
        assert basic["price_ksh"] == 99

    def test_pro_monthly_price_is_299(self, client):
        plans = client.get("/api/payments/plans").get_json()["data"]
        pro = next(p for p in plans if p["plan_id"] == "pro_monthly")
        assert pro["price_ksh"] == 299

    def test_subscription_status_inactive_by_default(self, client, auth_header):
        r = client.get("/api/payments/subscription", headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["is_active"] is False

    def test_dev_activate_basic_plan(self, client, auth_header):
        r = client.post("/api/payments/activate-dev",
                        json={"plan": "basic_monthly"}, headers=auth_header)
        assert r.status_code == 200

    def test_dev_activate_sets_subscription_active(self, client, auth_header):
        client.post("/api/payments/activate-dev",
                    json={"plan": "pro_monthly"}, headers=auth_header)
        r = client.get("/api/payments/subscription", headers=auth_header)
        assert r.get_json()["data"]["is_active"] is True

    def test_dev_activate_sets_correct_plan(self, client, auth_header):
        client.post("/api/payments/activate-dev",
                    json={"plan": "pro_monthly"}, headers=auth_header)
        r = client.get("/api/payments/subscription", headers=auth_header)
        assert r.get_json()["data"]["plan"] == "pro_monthly"

    def test_payment_history(self, client, auth_header):
        r = client.get("/api/payments/history", headers=auth_header)
        assert r.status_code == 200

    def test_subscribe_requires_token(self, client):
        r = client.post("/api/payments/subscribe",
                        json={"phone": "0711111111", "plan": "basic_monthly"})
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 10. AI CHAT
# ─────────────────────────────────────────────────────────────────────────────

class TestAIChat:
    def test_chat_returns_201(self, client, auth_header):
        r = client.post("/api/ai/chat",
                        json={"message": "How do I prevent maize rust?"},
                        headers=auth_header)
        assert r.status_code == 201

    def test_chat_response_in_data(self, client, auth_header):
        r = client.post("/api/ai/chat",
                        json={"message": "Best fertiliser for tomatoes?"},
                        headers=auth_header)
        assert "response" in r.get_json()["data"]

    def test_quick_answer(self, client, auth_header):
        r = client.post("/api/ai/quick-answer",
                        json={"message": "Is loam good for tea?"},
                        headers=auth_header)
        assert r.status_code in [200, 201]
        assert r.get_json()["success"] is True

    def test_list_conversations(self, client, auth_header):
        r = client.get("/api/ai/conversations", headers=auth_header)
        assert r.status_code == 200

    def test_get_conversation(self, client, auth_header):
        r = client.post("/api/ai/chat",
                        json={"message": "Weather today?"},
                        headers=auth_header)
        conv_id = r.get_json()["data"].get("conversation_id")
        if conv_id:
            r2 = client.get(f"/api/ai/conversations/{conv_id}", headers=auth_header)
            assert r2.status_code == 200

    def test_delete_conversation(self, client, auth_header):
        r = client.post("/api/ai/chat",
                        json={"message": "Test delete conv"},
                        headers=auth_header)
        conv_id = r.get_json()["data"].get("conversation_id")
        if conv_id:
            r2 = client.delete(f"/api/ai/conversations/{conv_id}", headers=auth_header)
            assert r2.status_code in [200, 204]

    def test_chat_requires_auth(self, client):
        r = client.post("/api/ai/chat", json={"message": "hello"})
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 11. GREENHOUSE & SENSORS
# ─────────────────────────────────────────────────────────────────────────────

class TestGreenhouse:
    GH_PAYLOAD = {
        "name": "Alpha Tunnel",
        "greenhouse_type": "tunnel",
        "width_meters": 8.0,
        "length_meters": 20.0,
        "covering_material": "polyethylene",
        "irrigation_system": "drip",
        "current_crop": "tomatoes"
    }

    def _create_gh(self, client, auth_header):
        return client.post("/api/greenhouse/", json=self.GH_PAYLOAD, headers=auth_header)

    def test_create_greenhouse_returns_201(self, client, auth_header):
        r = self._create_gh(client, auth_header)
        assert r.status_code == 201

    def test_create_greenhouse_data(self, client, auth_header):
        r = self._create_gh(client, auth_header)
        d = r.get_json()["data"]
        assert d["name"] == "Alpha Tunnel"
        assert d["current_crop"] == "tomatoes"

    def test_list_greenhouses(self, client, auth_header):
        self._create_gh(client, auth_header)
        r = client.get("/api/greenhouse/", headers=auth_header)
        assert r.status_code == 200
        assert isinstance(r.get_json()["data"], list)

    def test_get_greenhouse_by_id(self, client, auth_header):
        gh_id = self._create_gh(client, auth_header).get_json()["data"]["id"]
        r = client.get(f"/api/greenhouse/{gh_id}", headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["id"] == gh_id

    def test_update_greenhouse(self, client, auth_header):
        gh_id = self._create_gh(client, auth_header).get_json()["data"]["id"]
        r = client.put(f"/api/greenhouse/{gh_id}",
                       json={"name": "Updated Tunnel"}, headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["name"] == "Updated Tunnel"

    def test_log_reading_returns_201(self, client, auth_header):
        gh_id = self._create_gh(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/greenhouse/{gh_id}/readings", json={
            "temperature_celsius": 27.5,
            "humidity_percent": 70.0,
            "ph_level": 6.2,
            "ec_level": 1.6,
            "soil_moisture_percent": 58.0
        }, headers=auth_header)
        assert r.status_code == 201

    def test_reading_out_of_range_triggers_alerts(self, client, auth_header):
        gh_id = self._create_gh(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/greenhouse/{gh_id}/readings", json={
            "temperature_celsius": 45.0,  # dangerously high
            "humidity_percent": 95.0,
            "ph_level": 9.5,              # alkaline danger
            "ec_level": 5.0,
            "soil_moisture_percent": 5.0  # drought stress
        }, headers=auth_header)
        assert r.status_code == 201
        data = r.get_json()["data"]
        assert "alerts" in data and len(data["alerts"]) > 0

    def test_greenhouse_ai_advice(self, client, auth_header):
        gh_id = self._create_gh(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/greenhouse/{gh_id}/ai-advice", headers=auth_header)
        assert r.status_code in [200, 201]
        assert r.get_json()["success"] is True

    def test_greenhouse_requires_auth(self, client):
        r = client.get("/api/greenhouse/")
        assert r.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# 12. YIELD RECORDS
# ─────────────────────────────────────────────────────────────────────────────

class TestYields:
    YIELD_PAYLOAD = {
        "crop_name": "maize",
        "variety": "H614",
        "season": "2026_long_rains",
        "area_planted_acres": 3.0,
        "quantity_harvested_kg": 2700,
        "quantity_sold_kg": 2500,
        "price_per_kg": 42,
        "harvest_date": "2026-05-20",
        "seed_cost_ksh": 3000,
        "fertilizer_cost_ksh": 7000,
        "labor_cost_ksh": 4000
    }

    def _create_yield(self, client, auth_header):
        return client.post("/api/yields/", json=self.YIELD_PAYLOAD, headers=auth_header)

    def test_create_yield_returns_201(self, client, auth_header):
        r = self._create_yield(client, auth_header)
        assert r.status_code == 201

    def test_yield_data_structure(self, client, auth_header):
        r = self._create_yield(client, auth_header)
        d = r.get_json()["data"]
        assert d["crop_name"] == "maize"
        assert d["quantity_harvested_kg"] == 2700

    def test_yield_has_profit_fields(self, client, auth_header):
        r = self._create_yield(client, auth_header)
        d = r.get_json()["data"]
        assert "yield_per_acre" in d

    def test_list_yields(self, client, auth_header):
        self._create_yield(client, auth_header)
        r = client.get("/api/yields/", headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["summary"]["total_records"] >= 1

    def test_get_yield_by_id(self, client, auth_header):
        yield_id = self._create_yield(client, auth_header).get_json()["data"]["id"]
        r = client.get(f"/api/yields/{yield_id}", headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["data"]["id"] == yield_id

    def test_get_nonexistent_yield_returns_404(self, client, auth_header):
        r = client.get("/api/yields/00000000-0000-0000-0000-000000000000", headers=auth_header)
        assert r.status_code == 404

    def test_yield_analytics(self, client, auth_header):
        self._create_yield(client, auth_header)
        r = client.get("/api/yields/analytics", headers=auth_header)
        assert r.status_code == 200
        assert "by_crop" in r.get_json()["data"]

    def test_regenerate_ai_summary(self, client, auth_header):
        yield_id = self._create_yield(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/yields/{yield_id}/regenerate-summary", headers=auth_header)
        assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 13. FARM OPERATIONS, INVENTORY, BATCHES, COMPLIANCE
# ─────────────────────────────────────────────────────────────────────────────

class TestFarmOpsInventoryBatchesCompliance:
    def test_create_farm_operation(self, client, auth_header):
        r = client.post("/api/farm-ops/", json={
            "operation_type": "fertilising",
            "operation_date": "2026-05-10",
            "crop_name": "maize",
            "cost_ksh": 2500,
            "labor_count": 3,
            "duration_hours": 4.0
        }, headers=auth_header)
        assert r.status_code == 201
        assert r.get_json()["success"] is True

    def test_list_farm_operations(self, client, auth_header):
        client.post("/api/farm-ops/", json={
            "operation_type": "weeding", "operation_date": "2026-05-11",
            "crop_name": "beans", "cost_ksh": 800
        }, headers=auth_header)
        r = client.get("/api/farm-ops/", headers=auth_header)
        assert r.status_code == 200

    def test_ai_daily_plan(self, client, auth_header):
        r = client.post("/api/farm-ops/ai-daily-plan", headers=auth_header)
        assert r.status_code in [200, 201]
        assert r.get_json()["success"] is True

    def test_create_inventory_item(self, client, auth_header):
        r = client.post("/api/inventory/", json={
            "item_name": "CAN Fertilizer",
            "category": "fertilizer",
            "quantity": 10.0,
            "unit": "bag_50kg",
            "minimum_stock": 2.0,
            "unit_cost_ksh": 2800
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_inventory(self, client, auth_header):
        r = client.get("/api/inventory/", headers=auth_header)
        assert r.status_code == 200

    def test_adjust_inventory(self, client, auth_header):
        inv_id = client.post("/api/inventory/", json={
            "item_name": "Pyrethrum", "category": "pesticide",
            "quantity": 5.0, "unit": "bag_50kg",
            "minimum_stock": 1.0, "unit_cost_ksh": 1500
        }, headers=auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/inventory/{inv_id}/adjust",
                        json={"quantity_change": -2.0, "reason": "used on farm"},
                        headers=auth_header)
        assert r.status_code == 200

    def test_create_batch(self, client, auth_header):
        r = client.post("/api/batches/", json={
            "crop_name": "maize",
            "variety": "H614",
            "quantity_kg": 1500.0,
            "quality_grade": "A"
        }, headers=auth_header)
        assert r.status_code == 201
        d = r.get_json()["data"]
        assert "batch_number" in d
        assert d["batch_number"].startswith("BATCH")

    def test_list_batches(self, client, auth_header):
        r = client.get("/api/batches/", headers=auth_header)
        assert r.status_code == 200

    def test_update_batch_status(self, client, auth_header):
        batch_id = client.post("/api/batches/", json={
            "crop_name": "beans", "quantity_kg": 600.0, "quality_grade": "B"
        }, headers=auth_header).get_json()["data"]["id"]
        r = client.put(f"/api/batches/{batch_id}/status",
                       json={"status": "sold"}, headers=auth_header)
        assert r.status_code == 200

    def test_create_compliance_record(self, client, auth_header):
        r = client.post("/api/compliance/", json={
            "compliance_type": "GlobalGAP",
            "certificate_number": "GG-2026-001",
            "issuing_body": "Kenya Accreditation Service",
            "expiry_date": "2027-05-01",
            "status": "active"
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_compliance_records(self, client, auth_header):
        r = client.get("/api/compliance/", headers=auth_header)
        assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 14. FINANCIAL MODULE
# ─────────────────────────────────────────────────────────────────────────────

class TestFinancial:
    def test_financial_dashboard(self, client, auth_header):
        r = client.get("/api/financial/dashboard", headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["success"] is True

    def test_add_income_transaction(self, client, auth_header):
        r = client.post("/api/financial/transactions", json={
            "transaction_type": "income",
            "category": "crop_sales",
            "amount_ksh": 85000,
            "transaction_date": "2026-05-22",
            "crop_name": "maize",
            "payment_method": "mpesa"
        }, headers=auth_header)
        assert r.status_code == 201

    def test_add_expense_transaction(self, client, auth_header):
        r = client.post("/api/financial/transactions", json={
            "transaction_type": "expense",
            "category": "fertilizer",
            "amount_ksh": 7000,
            "transaction_date": "2026-05-01"
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_transactions(self, client, auth_header):
        r = client.get("/api/financial/transactions", headers=auth_header)
        assert r.status_code == 200

    def test_add_season_budget(self, client, auth_header):
        r = client.post("/api/financial/budgets", json={
            "season_name": "Long Rains 2026",
            "crop_name": "maize",
            "planned_seed_cost": 4000,
            "planned_fertilizer_cost": 8000,
            "planned_labor_cost": 6000,
            "expected_yield_kg": 3000,
            "expected_price_per_kg": 42
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_budgets(self, client, auth_header):
        r = client.get("/api/financial/budgets", headers=auth_header)
        assert r.status_code == 200

    def test_add_loan_record(self, client, auth_header):
        r = client.post("/api/financial/loans", json={
            "lender_name": "Equity Bank",
            "lender_type": "bank",
            "principal_ksh": 50000,
            "interest_rate_percent": 12,
            "due_date": "2027-01-01"
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_loans(self, client, auth_header):
        r = client.get("/api/financial/loans", headers=auth_header)
        assert r.status_code == 200

    def test_add_loan_repayment(self, client, auth_header):
        loan_id = client.post("/api/financial/loans", json={
            "lender_name": "KCB",
            "lender_type": "bank",
            "principal_ksh": 30000,
            "interest_rate_percent": 10,
            "due_date": "2026-12-01"
        }, headers=auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/financial/loans/{loan_id}/repayment",
                        json={"amount_ksh": 5000, "repayment_date": "2026-06-01"},
                        headers=auth_header)
        assert r.status_code == 200

    def test_add_insurance_policy(self, client, auth_header):
        r = client.post("/api/financial/insurance", json={
            "provider_name": "CIC Insurance",
            "insurance_type": "crop",
            "coverage_amount_ksh": 200000,
            "premium_ksh": 5000,
            "end_date": "2027-03-01",
            "status": "active"
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_insurance(self, client, auth_header):
        r = client.get("/api/financial/insurance", headers=auth_header)
        assert r.status_code == 200

    def test_profit_loss_report(self, client, auth_header):
        r = client.get("/api/financial/pl-report", headers=auth_header)
        assert r.status_code == 200
        assert r.get_json()["success"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 15. FARM INTELLIGENCE (Calendar, Soil, Irrigation, Pest Library)
# ─────────────────────────────────────────────────────────────────────────────

class TestFarmIntelligence:
    def test_create_calendar_entry(self, client, auth_header):
        r = client.post("/api/calendar/", json={
            "crop_name": "maize",
            "planned_planting_date": "2026-07-01",
            "area_acres": 2.5,
            "status": "planned",
            "reminder_days_before": 7
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_calendar_entries(self, client, auth_header):
        r = client.get("/api/calendar/", headers=auth_header)
        assert r.status_code == 200

    def test_update_calendar_entry(self, client, auth_header):
        entry_id = client.post("/api/calendar/", json={
            "crop_name": "beans",
            "planned_planting_date": "2026-08-01",
            "area_acres": 1.0,
            "status": "planned"
        }, headers=auth_header).get_json()["data"]["id"]
        r = client.put(f"/api/calendar/{entry_id}",
                       json={"status": "planted"}, headers=auth_header)
        assert r.status_code == 200

    def test_delete_calendar_entry(self, client, auth_header):
        entry_id = client.post("/api/calendar/", json={
            "crop_name": "kale",
            "planned_planting_date": "2026-09-01",
            "area_acres": 0.5,
            "status": "planned"
        }, headers=auth_header).get_json()["data"]["id"]
        r = client.delete(f"/api/calendar/{entry_id}", headers=auth_header)
        assert r.status_code == 200

    def test_add_soil_record(self, client, auth_header):
        r = client.post("/api/soil/", json={
            "ph_level": 6.5,
            "nitrogen_ppm": 45.0,
            "phosphorus_ppm": 30.0,
            "potassium_ppm": 120.0,
            "organic_matter_percent": 3.2,
            "soil_texture": "loam",
            "water_retention": "moderate"
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_soil_records(self, client, auth_header):
        r = client.get("/api/soil/", headers=auth_header)
        assert r.status_code == 200

    def test_create_irrigation_schedule(self, client, auth_header):
        r = client.post("/api/irrigation/", json={
            "crop_name": "tomatoes",
            "irrigation_type": "drip",
            "water_source": "borehole",
            "scheduled_date": "2026-06-10",
            "duration_minutes": 45,
            "water_amount_litres": 500,
            "status": "scheduled"
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_irrigation_schedules(self, client, auth_header):
        r = client.get("/api/irrigation/", headers=auth_header)
        assert r.status_code == 200

    def test_complete_irrigation(self, client, auth_header):
        sched_id = client.post("/api/irrigation/", json={
            "crop_name": "maize",
            "irrigation_type": "flood",
            "water_source": "river",
            "scheduled_date": "2026-06-12",
            "duration_minutes": 60,
            "status": "scheduled"
        }, headers=auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/irrigation/{sched_id}/complete", headers=auth_header)
        assert r.status_code == 200

    def test_search_pest_library(self, client):
        r = client.get("/api/pest-library/")
        assert r.status_code == 200
        assert r.get_json()["success"] is True

    def test_pest_library_filter_by_crop(self, client):
        r = client.get("/api/pest-library/?crop=maize")
        assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 16. COMMUNITY FORUM
# ─────────────────────────────────────────────────────────────────────────────

class TestCommunity:
    POST_PAYLOAD = {
        "title": "Best fertilizer for beans",
        "content": "Sharing my experience with top-dressing beans using CAN...",
        "category": "tips",
        "crop_tags": ["beans"]
    }

    def _create_post(self, client, auth_header):
        return client.post("/api/community/posts", json=self.POST_PAYLOAD, headers=auth_header)

    def test_get_posts_public(self, client):
        r = client.get("/api/community/posts")
        assert r.status_code == 200

    def test_create_post_requires_auth(self, client):
        r = client.post("/api/community/posts", json=self.POST_PAYLOAD)
        assert r.status_code == 401

    def test_create_post_returns_201(self, client, auth_header):
        r = self._create_post(client, auth_header)
        assert r.status_code == 201
        assert r.get_json()["data"]["title"] == "Best fertilizer for beans"

    def test_get_post_by_id(self, client, auth_header):
        post_id = self._create_post(client, auth_header).get_json()["data"]["id"]
        r = client.get(f"/api/community/posts/{post_id}")
        assert r.status_code == 200

    def test_add_comment_to_post(self, client, auth_header):
        post_id = self._create_post(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/community/posts/{post_id}/comments",
                        json={"content": "Great advice! I'll try this."},
                        headers=auth_header)
        assert r.status_code == 201

    def test_like_post(self, client, auth_header):
        post_id = self._create_post(client, auth_header).get_json()["data"]["id"]
        r = client.post(f"/api/community/posts/{post_id}/like", headers=auth_header)
        assert r.status_code == 200

    def test_unlike_post_toggle(self, client, auth_header):
        post_id = self._create_post(client, auth_header).get_json()["data"]["id"]
        client.post(f"/api/community/posts/{post_id}/like", headers=auth_header)
        r = client.post(f"/api/community/posts/{post_id}/like", headers=auth_header)
        assert r.status_code == 200  # toggles off

    def test_community_stats(self, client):
        r = client.get("/api/community/stats")
        assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 17. MARKET PRO (Price Alerts & Buyer Directory)
# ─────────────────────────────────────────────────────────────────────────────

class TestMarketPro:
    def test_create_price_alert(self, client, auth_header):
        r = client.post("/api/market/alerts", json={
            "crop_name": "maize",
            "target_price_ksh": 50,
            "condition": "above",
            "notify_via": ["sms"]
        }, headers=auth_header)
        assert r.status_code == 201

    def test_list_price_alerts(self, client, auth_header):
        r = client.get("/api/market/alerts", headers=auth_header)
        assert r.status_code == 200

    def test_update_price_alert(self, client, auth_header):
        alert_id = client.post("/api/market/alerts", json={
            "crop_name": "beans",
            "target_price_ksh": 120,
            "condition": "below",
            "notify_via": ["sms"]
        }, headers=auth_header).get_json()["data"]["id"]
        r = client.put(f"/api/market/alerts/{alert_id}",
                       json={"target_price_ksh": 130}, headers=auth_header)
        assert r.status_code == 200

    def test_delete_price_alert(self, client, auth_header):
        alert_id = client.post("/api/market/alerts", json={
            "crop_name": "tomatoes",
            "target_price_ksh": 80,
            "condition": "above",
            "notify_via": ["sms"]
        }, headers=auth_header).get_json()["data"]["id"]
        r = client.delete(f"/api/market/alerts/{alert_id}", headers=auth_header)
        assert r.status_code == 200

    def test_list_buyers_directory(self, client, auth_header):
        r = client.get("/api/market/buyers", headers=auth_header)
        assert r.status_code == 200

    def test_get_buyer_by_id(self, client, auth_header):
        buyers = client.get("/api/market/buyers", headers=auth_header).get_json()["data"]
        if buyers:
            buyer_id = buyers[0]["id"]
            r = client.get(f"/api/market/buyers/{buyer_id}", headers=auth_header)
            assert r.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 18. AGRO-DEALER
# ─────────────────────────────────────────────────────────────────────────────

class TestAgroDealer:
    PROFILE_PAYLOAD = {
        "business_name": "Meru Seeds & Fertilizers",
        "county": "Meru",
        "business_location": "Meru CBD",
        "products": ["seeds", "fertilizers", "pesticides"]
    }

    def _create_profile(self, client, dealer_auth_header):
        return client.post("/api/dealer/profile",
                           json=self.PROFILE_PAYLOAD, headers=dealer_auth_header)

    def test_create_dealer_profile(self, client, dealer_auth_header):
        r = self._create_profile(client, dealer_auth_header)
        assert r.status_code in [200, 201, 409]

    def test_get_dealer_profile(self, client, dealer_auth_header):
        self._create_profile(client, dealer_auth_header)
        r = client.get("/api/dealer/profile", headers=dealer_auth_header)
        assert r.status_code == 200

    def test_update_dealer_profile(self, client, dealer_auth_header):
        self._create_profile(client, dealer_auth_header)
        r = client.put("/api/dealer/profile",
                       json={"business_name": "Meru Agro Ltd"}, headers=dealer_auth_header)
        assert r.status_code == 200

    def test_add_product(self, client, dealer_auth_header):
        self._create_profile(client, dealer_auth_header)
        r = client.post("/api/dealer/products", json={
            "crop_name": "maize",
            "product_name": "DAP 50kg",
            "product_type": "fertilizer",
            "description": "High-quality DAP for maize",
            "price_ksh": 3300
        }, headers=dealer_auth_header)
        assert r.status_code in [200, 201]

    def test_list_products(self, client, dealer_auth_header):
        r = client.get("/api/dealer/products", headers=dealer_auth_header)
        assert r.status_code == 200

    def test_dealer_stats(self, client, dealer_auth_header):
        self._create_profile(client, dealer_auth_header)
        r = client.get("/api/dealer/stats", headers=dealer_auth_header)
        assert r.status_code == 200

    def test_dealer_blocked_from_farmer_routes(self, client, dealer_auth_header):
        r = client.get("/api/farms/", headers=dealer_auth_header)
        assert r.status_code in [403, 404]  # no farmer profile


# ─────────────────────────────────────────────────────────────────────────────
# 19. NGO
# ─────────────────────────────────────────────────────────────────────────────

class TestNGO:
    PROFILE_PAYLOAD = {
        "organization_name": "Kenya Farmers Alliance",
        "organization_type": "ngo",
        "focus_counties": ["Nakuru", "Meru"],
        "focus_crops": ["maize", "beans"],
        "total_beneficiaries_target": 1000
    }

    def _create_profile(self, client, ngo_auth_header):
        return client.post("/api/ngo/profile",
                           json=self.PROFILE_PAYLOAD, headers=ngo_auth_header)

    def test_create_ngo_profile(self, client, ngo_auth_header):
        r = self._create_profile(client, ngo_auth_header)
        assert r.status_code in [200, 201, 409]

    def test_get_ngo_profile(self, client, ngo_auth_header):
        self._create_profile(client, ngo_auth_header)
        r = client.get("/api/ngo/profile", headers=ngo_auth_header)
        assert r.status_code == 200

    def test_update_ngo_profile(self, client, ngo_auth_header):
        self._create_profile(client, ngo_auth_header)
        r = client.put("/api/ngo/profile",
                       json={"total_beneficiaries_target": 2000}, headers=ngo_auth_header)
        assert r.status_code == 200

    def test_ngo_dashboard(self, client, ngo_auth_header):
        self._create_profile(client, ngo_auth_header)
        r = client.get("/api/ngo/dashboard", headers=ngo_auth_header)
        assert r.status_code == 200

    def test_ngo_bulk_register(self, client, ngo_auth_header):
        self._create_profile(client, ngo_auth_header)
        r = client.post("/api/ngo/farmers/bulk-register", json={
            "county": "Nakuru",
            "batch_name": "Nakuru Q3 2026",
            "farmers": [
                {"phone": "0741020001", "first_name": "Wanjiku", "last_name": "M", "sub_county": "Nakuru East"}
            ]
        }, headers=ngo_auth_header)
        assert r.status_code in [200, 201, 202]

    def test_ngo_bulk_register_status(self, client, ngo_auth_header):
        self._create_profile(client, ngo_auth_header)
        r = client.post("/api/ngo/farmers/bulk-register", json={
            "county": "Meru",
            "batch_name": "Meru Q3 2026",
            "farmers": [{"phone": "0741020002", "first_name": "Kamau", "last_name": "J"}]
        }, headers=ngo_auth_header)
        batch_id = r.get_json().get("data", {}).get("batch_id")
        if batch_id:
            r2 = client.get(f"/api/ngo/farmers/bulk-register/{batch_id}", headers=ngo_auth_header)
            assert r2.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 20. ADMIN DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

class TestAdmin:
    def test_admin_stats(self, client, admin_auth_header):
        r = client.get("/api/admin/stats", headers=admin_auth_header)
        assert r.status_code == 200
        assert r.get_json()["success"] is True

    def test_admin_revenue(self, client, admin_auth_header):
        r = client.get("/api/admin/revenue", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_top_counties(self, client, admin_auth_header):
        r = client.get("/api/admin/top-counties", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_top_crops(self, client, admin_auth_header):
        r = client.get("/api/admin/top-crops", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_recent_farmers(self, client, admin_auth_header):
        r = client.get("/api/admin/recent-farmers", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_system_health(self, client, admin_auth_header):
        r = client.get("/api/admin/system-health", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_list_farmers(self, client, admin_auth_header):
        r = client.get("/api/admin/farmers", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_sms_logs(self, client, admin_auth_header):
        r = client.get("/api/admin/sms-logs", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_subscriptions(self, client, admin_auth_header):
        r = client.get("/api/admin/subscriptions", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_alerts(self, client, admin_auth_header):
        r = client.get("/api/admin/alerts", headers=admin_auth_header)
        assert r.status_code == 200

    def test_admin_send_alert(self, client, admin_auth_header):
        r = client.post("/api/admin/alerts/send", json={
            "title": "System Maintenance",
            "message": "System will be down Sunday 10pm-11pm EAT",
            "severity": "info"
        }, headers=admin_auth_header)
        assert r.status_code in [200, 201]


# ─────────────────────────────────────────────────────────────────────────────
# 21. USSD SIMULATION
# ─────────────────────────────────────────────────────────────────────────────

class TestUSSD:
    PHONE = "%2B254700000001"

    def test_main_menu_is_CON(self, client):
        r = client.get(f"/api/ussd/test?phone={self.PHONE}&text=")
        assert r.status_code == 200
        assert r.get_json()["response"].startswith("CON")

    def test_main_menu_has_five_options(self, client):
        resp = client.get(f"/api/ussd/test?phone={self.PHONE}&text=").get_json()["response"]
        for i in range(1, 6):
            assert str(i) in resp

    def test_weather_submenu(self, client):
        r = client.get(f"/api/ussd/test?phone={self.PHONE}&text=1")
        assert r.status_code == 200
        assert r.get_json()["response"].startswith("CON")

    def test_today_weather_ends_with_END(self, client):
        r = client.get(f"/api/ussd/test?phone={self.PHONE}&text=1*1")
        resp = r.get_json()["response"]
        assert resp.startswith("END")

    def test_market_prices_via_ussd(self, client):
        r = client.get(f"/api/ussd/test?phone={self.PHONE}&text=3*1")
        resp = r.get_json()["response"]
        assert resp.startswith("END")
        assert "KSH" in resp

    def test_subscribe_menu(self, client):
        r = client.get(f"/api/ussd/test?phone={self.PHONE}&text=5")
        resp = r.get_json()["response"]
        assert resp.startswith("CON")
        assert "99" in resp and "299" in resp

    def test_ussd_within_182_char_limit(self, client):
        r = client.get(f"/api/ussd/test?phone={self.PHONE}&text=1*1")
        resp = r.get_json()["response"]
        assert len(resp) <= 182


# ─────────────────────────────────────────────────────────────────────────────
# 22. SMS & WHATSAPP ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class TestSMSAndWhatsApp:
    def test_sms_logs_requires_admin(self, client, auth_header):
        r = client.get("/api/sms/logs", headers=auth_header)
        assert r.status_code == 403

    def test_sms_logs_admin_access(self, client, admin_auth_header):
        r = client.get("/api/sms/logs", headers=admin_auth_header)
        assert r.status_code == 200

    def test_send_individual_sms_admin(self, client, admin_auth_header):
        r = client.post("/api/sms/send-individual", json={
            "phone": "0711000001",
            "message": "Test SMS from admin"
        }, headers=admin_auth_header)
        assert r.status_code in [200, 201]

    def test_send_bulk_sms_admin(self, client, admin_auth_header):
        r = client.post("/api/sms/send-bulk", json={
            "message": "Bulk test message",
            "phone_numbers": ["0711000002", "0711000003"]
        }, headers=admin_auth_header)
        assert r.status_code in [200, 201]

    def test_whatsapp_webhook_get(self, client):
        r = client.get("/api/whatsapp/webhook")
        assert r.status_code in [200, 400]  # 400 if verification token missing

    def test_whatsapp_webhook_post(self, client):
        r = client.post("/api/whatsapp/webhook", json={"object": "whatsapp_business_account"})
        assert r.status_code in [200, 400]
