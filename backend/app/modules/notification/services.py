import os
import aiosmtplib
from email.message import EmailMessage
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.shared.database.models import SystemAlert
from app.modules.notification.repositories import NotificationRepository
from app.modules.notification.schemas import AlertCreate
from typing import List, Optional

BREVO_APP_NAME = "MediClues+ ERP"

class NotificationService:
    @staticmethod
    async def create_alert(db: AsyncSession, data: AlertCreate) -> dict:
        alert = SystemAlert(
            hospital_id=data.hospital_id,
            from_user_id=data.from_user_id,
            to_user_id=data.to_user_id,
            to_role=data.to_role,
            message=data.message,
            type=data.type
        )
        await NotificationRepository.create_alert(db, alert)
        return {"status": "Alert Created"}

    @staticmethod
    async def send_emergency_alert(db: AsyncSession, data: dict) -> dict:
        alert = SystemAlert(
            hospital_id=data['hospital_id'],
            from_user_id=data['from_user_id'],
            to_role='doctor', 
            message=data['message'],
            type="emergency"
        )
        await NotificationRepository.create_alert(db, alert)
        return {"status": "Emergency Alert Transmitted"}

    @staticmethod
    async def get_system_alerts(db: AsyncSession, user_id: int) -> List[SystemAlert]:
        return await NotificationRepository.get_alerts_by_user_id(db, user_id)

    # --- EMAIL SERVICES CONSOLIDATED ---
    @staticmethod
    async def send_email(to: str, subject: str, html_content: str, recipient_name: str = "User", sender_name: str = None) -> dict:
        try:
            smtp_host = os.getenv("EMAIL_HOST", "smtp-relay.brevo.com")
            smtp_port = int(os.getenv("EMAIL_PORT", "587"))
            smtp_user = os.getenv("EMAIL_USER")
            smtp_pass = os.getenv("EMAIL_APP_PASSWORD")
            sender_email = os.getenv("BREVO_SENDER_EMAIL") or smtp_user
            
            if not smtp_user or not smtp_pass:
                raise Exception("SMTP credentials not fully configured in .env")

            msg = EmailMessage()
            msg["From"] = f"{sender_name or BREVO_APP_NAME} <{sender_email}>"
            msg["To"] = f"{recipient_name} <{to}>"
            msg["Subject"] = subject
            msg.set_content("HTML content received", subtype="html")
            msg.add_alternative(html_content, subtype="html")

            await aiosmtplib.send(
                msg,
                hostname=smtp_host,
                port=smtp_port,
                start_tls=True,
                username=smtp_user,
                password=smtp_pass
            )
            return {"success": True, "message": "Email sent successfully"}
        except Exception as e:
            print(f"[ERROR] Email SMTP failed: {e}")
            return {"success": False, "message": str(e)}

    @staticmethod
    async def send_welcome_email(email: str, name: str) -> dict:
        subject = "Welcome to MediClues+ ERP"
        html_content = f"<h1>Welcome {name}!</h1><p>Your account is ready.</p>"
        return await NotificationService.send_email(email, subject, html_content, name)

    @staticmethod
    async def send_password_reset_otp(email: str, otp: str, user_name: str) -> dict:
        subject = "Password Reset OTP - MediClues"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <h1 style="text-align: center; color: #5f6fff;">🔐 Password Reset Request</h1>
                    <p>Hi {user_name},</p>
                    <p>We received a request to reset your password. Use the OTP below to complete the process:</p>
                    <div style="background-color: #5f6fff; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                        {otp}
                    </div>
                    <p style="background-color: #fff3cd; padding: 15px; border-radius: 4px;">
                        <strong>Important:</strong> This OTP is valid for 10 minutes only. Do not share it with anyone.
                    </p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                    <p style="text-align: center; font-size: 12px; color: #666;">© {datetime.now().year} MedClues. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        return await NotificationService.send_email(email, subject, html_content, user_name)

    @staticmethod
    async def send_appointment_confirmation(email: str, details: dict) -> dict:
        patient_name = details.get('patientName', 'Patient')
        hospital_name = details.get('hospitalName', 'MedClues Hospital')
        subject = f"Appointment Confirmed - {hospital_name}"
        html_content = f"""
        <html>
            <body>
                <h1>✨ Appointment Confirmed!</h1>
                <p>Hi <strong>{patient_name}</strong>,</p>
                <p>Your appointment is scheduled at {hospital_name}. Details:</p>
                <ul>
                    <li>Doctor: {details.get('doctorName')}</li>
                    <li>Specialty: {details.get('speciality')}</li>
                    <li>Date: {details.get('date')}</li>
                    <li>Time: {details.get('time')}</li>
                    <li>Token: #{details.get('tokenNumber')}</li>
                </ul>
            </body>
        </html>
        """
        return await NotificationService.send_email(email, subject, html_content, patient_name)

    @staticmethod
    async def send_appointment_reschedule_notification(email: str, details: dict) -> dict:
        patient_name = details.get('patientName', 'Patient')
        subject = "⚠️ Appointment Rescheduled - Missed Slot Notification"
        html_content = f"""
        <html>
            <body>
                <h1>⚠️ Appointment Rescheduled</h1>
                <p>Hi {patient_name},</p>
                <p>Your missed slot has been auto-rescheduled. New details:</p>
                <ul>
                    <li>Doctor: {details.get('doctorName')}</li>
                    <li>New Date: {details.get('newDate')}</li>
                    <li>Time: {details.get('time')}</li>
                    <li>Token: #{details.get('tokenNumber')}</li>
                </ul>
            </body>
        </html>
        """
        return await NotificationService.send_email(email, subject, html_content, patient_name)

    @staticmethod
    async def handle_patient_registered(data: dict) -> None:
        """
        Subscribed event handler to record welcome notifications for registered patients.
        """
        from app.db.session import AsyncSessionLocal
        from app.shared.database.models import SystemAlert
        
        async with AsyncSessionLocal() as db:
            alert = SystemAlert(
                hospital_id=1,
                from_user_id=1, # System/Admin
                to_user_id=data["patient_id"],
                message=f"Welcome {data['name']} to MediClues+! Your patient profile is successfully created.",
                type="notification"
            )
            db.add(alert)
            await db.commit()
            print(f"[EVENT CONSUMED] Created welcome notification alert for patient_id={data['patient_id']}")

    @staticmethod
    async def handle_employee_created(data: dict) -> None:
        """
        Subscribed event handler to record registration notifications for employees.
        """
        from app.db.session import AsyncSessionLocal
        from app.shared.database.models import SystemAlert
        
        async with AsyncSessionLocal() as db:
            alert = SystemAlert(
                hospital_id=data["hospital_id"],
                from_user_id=1, # System/Admin
                to_user_id=data["employee_id"],
                message=f"Welcome {data['name']}! Your staff account has been registered with role '{data['role']}'.",
                type="notification"
            )
            db.add(alert)
            await db.commit()
            print(f"[EVENT CONSUMED] Created welcome notification alert for employee_id={data['employee_id']}")

    @staticmethod
    async def handle_appointment_booked(data: dict) -> None:
        """
        Subscribed event handler to record booking notifications.
        """
        from app.db.session import AsyncSessionLocal
        from app.shared.database.models import SystemAlert
        
        async with AsyncSessionLocal() as db:
            alert = SystemAlert(
                hospital_id=data["hospital_id"],
                from_user_id=1, # System/Admin
                to_user_id=data["patient_id"],
                message=f"Appointment scheduled successfully. Token: #{data['token_number']}.",
                type="notification"
            )
            db.add(alert)
            await db.commit()
            print(f"[EVENT CONSUMED] Created booking notification alert for patient_id={data['patient_id']}")

    @staticmethod
    async def handle_inventory_updated(data: dict) -> None:
        """
        Subscribed event handler to issue warning alerts if stock quantities fall below threshold.
        """
        qty = data["quantity"]
        limit = data["min_threshold"]
        if qty <= limit:
            from app.db.session import AsyncSessionLocal
            from app.shared.database.models import SystemAlert
            
            async with AsyncSessionLocal() as db:
                alert = SystemAlert(
                    hospital_id=1, # Default
                    from_user_id=1, # System/Admin
                    to_role="hospital_admin",
                    message=f"Low Stock Warning: Item '{data['name']}' quantity has fallen to {qty}.",
                    type="notification"
                )
                db.add(alert)
                await db.commit()
                print(f"[EVENT CONSUMED] Created low stock notification alert for item '{data['name']}'")

