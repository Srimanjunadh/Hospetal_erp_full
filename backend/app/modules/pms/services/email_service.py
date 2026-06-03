import os
import aiosmtplib
import httpx
from email.message import EmailMessage
from datetime import datetime
import json

# Placeholder for settings, will use env variables directly
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_APP_NAME = "MediClues+ ERP"

async def send_email(to: str, subject: str, html_content: str, recipient_name: str = "User", sender_name: str = None):
    try:
        api_key = BREVO_API_KEY
        sender_email = BREVO_SENDER_EMAIL or os.getenv("EMAIL_USER")
        app_name = BREVO_APP_NAME
        
        if not api_key:
            raise Exception("API Key missing")

        # Brevo HTTP API v3 endpoint
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": api_key
        }
        
        payload = {
            "sender": {"email": sender_email, "name": sender_name or app_name},
            "to": [{"email": to, "name": recipient_name}],
            "subject": subject,
            "htmlContent": html_content
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            
        if response.status_code == 201:
            return {"success": True, "message": "Email sent"}
        else:
            raise Exception(f"Brevo API error: {response.status_code}")

    except Exception as e:
        print(f"[WARNING] Brevo HTTP failed: {e}. Trying Gmail SMTP as fallback...")
        try:
            # Fallback to Gmail SMTP if Brevo fails
            gmail_user = os.getenv("EMAIL_USER")
            gmail_pass = os.getenv("EMAIL_APP_PASSWORD")
            
            if not gmail_user or not gmail_pass:
                return {"success": False, "message": "No configured email routes working"}

            msg = EmailMessage()
            msg["From"] = f"{sender_name or 'MediClues+'} <{gmail_user}>"
            msg["To"] = f"{recipient_name} <{to}>"
            msg["Subject"] = subject
            msg.set_content("HTML content received", subtype="html") # Fallback plain text
            msg.add_alternative(html_content, subtype="html")

            await aiosmtplib.send(
                msg,
                hostname="smtp.gmail.com",
                port=587,
                start_tls=True,
                username=gmail_user,
                password=gmail_pass
            )
            return {"success": True, "message": "Email sent via fallback"}
        except Exception as fallback_e:
            return {"success": False, "message": str(fallback_e)}

async def send_password_reset_otp(email: str, otp: str, user_name: str):
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
                <p style="text-align: center; font-size: 12px; color: #666;">© {datetime.now().year} MediClues. All rights reserved.</p>
            </div>
        </body>
    </html>
    """
    return await send_email(email, subject, html_content, user_name)

async def send_appointment_confirmation(email: str, details: dict):
    patient_name = details.get('patientName', 'Patient')
    hospital_name = details.get('hospitalName', 'MediClues Hospital')
    
    subject = f"Appointment Confirmed - {hospital_name}"
    
    html_content = f"""
    <html>
        <head>
            <style>
                .medclues-highlight {{
                    color: #bfdbfe;
                }}
            </style>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="background-color: #5f6fff; color: white; padding: 25px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🏥 MediClues+</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Your Health, Our Priority</p>
            </div>
            
            <div style="padding: 30px;">
                <p style="margin-top: 0;">Dear {patient_name},</p>
                
                <div style="background-color: #22c55e; color: white; padding: 12px; border-radius: 4px; text-align: center; font-weight: bold; margin-bottom: 20px;">
                    ✓ Your Appointment Has Been Confirmed!
                </div>
                
                <p>We're pleased to confirm your appointment at MediClues Hospital. Please find your appointment details below:</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #5f6fff; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
                    <h2 style="color: #5f6fff; margin: 0 0 15px 0; font-size: 18px;">📋 Appointment Details</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; width: 30%; color: #64748b;">👨‍⚕️ Doctor:</td>
                            <td style="padding: 10px 0; font-weight: 500;">{details.get('doctorName')}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; color: #64748b;">🩺 Specialty:</td>
                            <td style="padding: 10px 0; font-weight: 500;">{details.get('speciality')}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; color: #64748b;">📅 Date:</td>
                            <td style="padding: 10px 0; font-weight: 500;">{details.get('date')}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; color: #64748b;">🕒 Time:</td>
                            <td style="padding: 10px 0; font-weight: 500;">{details.get('time')}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; color: #64748b;">💰 Consultation Fee:</td>
                            <td style="padding: 10px 0; font-weight: 500;">₹{details.get('fee')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #64748b;">📍 Location:</td>
                            <td style="padding: 10px 0; font-weight: 500; line-height: 1.4;">{details.get('hospitalLocation', 'MediClues Hospital')}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #5f6fff; color: white; padding: 25px; border-radius: 4px; text-align: center; margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 14px;">Your Token Number</p>
                    <h1 style="margin: 10px 0; font-size: 36px;">#{details.get('tokenNumber', 'N/A')}</h1>
                    <p style="margin: 0; font-size: 12px; opacity: 0.9;">Please show this at the reception</p>
                </div>
            </div>
        </body>
    </html>
    """
    return await send_email(email, subject, html_content, patient_name)

async def send_appointment_reschedule_notification(email: str, details: dict):
    patient_name = details.get('patientName', 'Patient')
    doctor_name = details.get('doctorName', 'Doctor')
    old_date = details.get('oldDate', 'N/A')
    new_date = details.get('newDate', 'N/A')
    time = details.get('time', 'N/A')
    token_number = details.get('tokenNumber', 'N/A')
    
    subject = f"⚠️ Appointment Rescheduled - Missed Slot Notification"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="background-color: #ef4444; color: white; padding: 25px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🏥 MediClues+</h1>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Appointment Missed & Auto-Rescheduled</p>
            </div>
            
            <div style="padding: 30px;">
                <p style="margin-top: 0;">Dear {patient_name},</p>
                
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; color: #991b1b; font-weight: bold; margin-bottom: 20px; font-size: 14px;">
                    ⚠️ Your scheduled appointment slot on {old_date} at {time} has expired (your time is over).
                </div>
                
                <p>To ensure you still receive care, the hospital queue system has automatically re-scheduled your consultation to <strong>tomorrow</strong> for the exact same timing.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #5f6fff; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
                    <h2 style="color: #5f6fff; margin: 0 0 15px 0; font-size: 18px;">📋 New Rescheduled Details</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; width: 35%; color: #64748b;">👨‍⚕️ Doctor:</td>
                            <td style="padding: 10px 0; font-weight: 500;">{doctor_name}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; color: #64748b;">📅 Rescheduled Date:</td>
                            <td style="padding: 10px 0; font-weight: 700; color: #2563eb;">{new_date} (Tomorrow)</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 0; color: #64748b;">🕒 Time Slot:</td>
                            <td style="padding: 10px 0; font-weight: 500;">{time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #64748b;">📍 Token Number:</td>
                            <td style="padding: 10px 0; font-weight: 700; color: #16a34a;">#{token_number}</td>
                        </tr>
                    </table>
                </div>
                
                <p style="font-size: 13px; color: #64748b; font-style: italic;">
                    Please present your updated digital pass or check-in QR code at the reception desk tomorrow 10 minutes prior to your time.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;">
                <p style="text-align: center; font-size: 12px; color: #666;">© {datetime.now().year} MediClues. All rights reserved.</p>
            </div>
        </body>
    </html>
    """
    return await send_email(email, subject, html_content, patient_name)

async def send_welcome_email(email: str, name: str):
    subject = "Welcome to MediClues+ ERP"
    html_content = f"<h1>Welcome {name}!</h1><p>Your account is ready.</p>"
    return await send_email(email, subject, html_content, name)
