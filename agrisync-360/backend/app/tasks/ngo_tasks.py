from celery_worker import celery
from datetime import datetime, timezone
import logging

from app.extensions import db
from app.models.user import User
from app.models.farmer import Farmer
from app.models.ngo import BulkFarmerRegistration
from app.models.payment import Payment
from app.models.crop import Crop
from app.models.farm import Farm
from app.services.sms_service import SMSService
import secrets

logger = logging.getLogger(__name__)


@celery.task
def process_bulk_farmer_registration(batch_id, farmers_data, ngo_id):
    """
    Process bulk farmer registration asynchronously.
    Called by POST /api/ngo/farmers/bulk-register
    """
    try:
        from app.models.ngo import BulkFarmerRegistration
        batch = BulkFarmerRegistration.query.get(batch_id)
        if not batch:
            logger.error(f"Batch {batch_id} not found")
            return {
                "batch_id": batch_id,
                "error": "Batch not found"
            }
        
        # Update batch status
        batch.status = 'processing'
        db.session.commit()
        
        successful = 0
        failed = 0
        errors = []
        
        for farmer_data in farmers_data:
            try:
                # Extract farmer data
                phone = farmer_data.get('phone', '').strip()
                first_name = farmer_data.get('first_name', '').strip()
                last_name = farmer_data.get('last_name', '').strip()
                sub_county = farmer_data.get('sub_county', '').strip()
                crops = farmer_data.get('crops', [])
                
                if not phone or not first_name or not last_name:
                    failed += 1
                    errors.append({
                        "phone": phone,
                        "error": "Missing required fields: phone, first_name, last_name"
                    })
                    continue
                
                # Check duplicate phone
                normalized_phone = SMSService.normalize_phone(phone)
                existing_user = User.query.filter_by(phone=normalized_phone).first()
                if existing_user:
                    failed += 1
                    errors.append({
                        "phone": phone,
                        "error": "Duplicate phone number"
                    })
                    continue
                
                # Create user account
                temp_password = secrets.token_hex(4).upper()
                user = User(
                    phone=normalized_phone,
                    role='farmer',
                    is_active=True,
                    is_verified=True  # NGO verified them
                )
                user.set_password(temp_password)
                db.session.add(user)
                db.session.flush()
                
                # Create farmer profile
                farmer = Farmer(
                    user_id=user.id,
                    first_name=first_name,
                    last_name=last_name,
                    county=batch.county,
                    sub_county=sub_county
                )
                db.session.add(farmer)
                db.session.flush()
                
                # Create default farm
                from app.models.farm import Farm
                default_farm = Farm(
                    farmer_id=farmer.id,
                    name=f"{first_name}'s Farm",
                    county=batch.county,
                    sub_county=sub_county,
                    size_acres=1.0,
                    soil_type='loam',
                    water_source='rain',
                    is_primary=True
                )
                db.session.add(default_farm)
                db.session.flush()
                
                # Add crops if provided
                if crops:
                    for crop_name in crops:
                        crop = Crop(
                            farmer_id=farmer.id,
                            farm_id=default_farm.id,
                            crop_name=crop_name.lower(),
                            planting_date=datetime.utcnow().date(),
                            area_planted_acres=0.5,
                            growth_stage='land_prep'
                        )
                        db.session.add(crop)
                
                # Activate basic subscription (NGO pays)
                from app.services.mpesa_service import MpesaService
                basic_sub = MpesaService.create_subscription(
                    farmer_id=farmer.id,
                    plan='basic_monthly',
                    amount=0,  # NGO sponsored
                    payment_method='ngo_sponsored'
                )
                if basic_sub:
                    db.session.add(basic_sub)
                
                # Send welcome SMS
                welcome_msg = (
                    f"Karibu AgriSync 360, {first_name}!\n"
                    f"Your account has been created by {batch.county}.\n"
                    f"Temporary password: {temp_password}\n"
                    f"Basic subscription activated.\n"
                    f"Namba ya msaada: 0722 000 360"
                )
                
                SMSService.send_sms(
                    normalized_phone,
                    welcome_msg,
                    'welcome',
                    farmer.id
                )
                
                successful += 1
                logger.info(f"Successfully registered farmer: {phone}")
                
            except Exception as e:
                failed += 1
                errors.append({
                    "phone": phone,
                    "error": str(e)
                })
                db.session.rollback()
                continue
        
        # Update batch completion
        batch.status = 'completed'
        batch.successful_registrations = successful
        batch.failed_registrations = failed
        batch.completed_at = datetime.now(timezone.utc)
        db.session.commit()
        
        logger.info(f"Batch {batch_id} completed: {successful} successful, {failed} failed")
        
        return {
            "batch_id": batch_id,
            "successful": successful,
            "failed": failed,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Error processing batch {batch_id}: {str(e)}")
        
        # Update batch as failed
        try:
            batch = BulkFarmerRegistration.query.get(batch_id)
            if batch:
                batch.status = 'failed'
                batch.completed_at = datetime.now(timezone.utc)
                db.session.commit()
        except:
            pass
        
        return {
            "batch_id": batch_id,
            "error": str(e)
        }
