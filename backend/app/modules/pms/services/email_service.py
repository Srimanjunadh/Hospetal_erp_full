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
        smtp_host = os.getenv("EMAIL_HOST", "smtp-relay.brevo.com")
        smtp_port = int(os.getenv("EMAIL_PORT", "587"))
        smtp_user = os.getenv("EMAIL_USER")
        smtp_pass = os.getenv("EMAIL_APP_PASSWORD")
        sender_email = os.getenv("BREVO_SENDER_EMAIL") or smtp_user
        app_name = BREVO_APP_NAME
        
        if not smtp_user or not smtp_pass:
            raise Exception("SMTP credentials not fully configured in .env")

        msg = EmailMessage()
        msg["From"] = f"{sender_name or app_name} <{sender_email}>"
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
                <p style="text-align: center; font-size: 12px; color: #666;">© {datetime.now().year} MedClues. All rights reserved.</p>
            </div>
        </body>
    </html>
    """
    return await send_email(email, subject, html_content, user_name)

async def send_appointment_confirmation(email: str, details: dict):
    patient_name = details.get('patientName', 'Patient')
    hospital_name = details.get('hospitalName', 'MedClues Hospital')
    
    subject = f"Appointment Confirmed - {hospital_name}"
    
    html_content = f"""
    <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
                body {{
                    font-family: 'Outfit', sans-serif;
                    line-height: 1.6;
                    color: #1e293b;
                    margin: 0;
                    padding: 0;
                    background-color: #f8fafc;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background: #ffffff;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                }}
                .header p {{
                    margin: 10px 0 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .success-banner {{
                    background: linear-gradient(to right, #10b981, #059669);
                    color: white;
                    padding: 16px;
                    border-radius: 12px;
                    text-align: center;
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
                }}
                .details-card {{
                    background: #f1f5f9;
                    border-left: 5px solid #3b82f6;
                    padding: 25px;
                    border-radius: 0 12px 12px 0;
                    margin-bottom: 30px;
                }}
                .details-card h2 {{
                    color: #0f172a;
                    margin: 0 0 20px 0;
                    font-size: 20px;
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px dashed #cbd5e1;
                }}
                .detail-row:last-child {{
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }}
                .detail-label {{
                    color: #64748b;
                    font-weight: 500;
                }}
                .detail-value {{
                    font-weight: 600;
                    color: #0f172a;
                    text-align: right;
                }}
                .token-box {{
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 16px;
                    text-align: center;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2);
                }}
                .token-box p {{ margin: 0; color: #94a3b8; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; }}
                .token-box h1 {{ margin: 10px 0; font-size: 48px; color: #38bdf8; letter-spacing: 2px; }}
                .info-box {{
                    background: #fef3c7;
                    border: 1px solid #fde68a;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }}
                .btn {{
                    display: inline-block;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
                    text-align: center;
                }}
                .footer {{ text-align: center; padding-top: 30px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏥 MediChain+</h1>
                    <p>Your Health, Our Priority</p>
                </div>
                
                <div class="content">
                    <p style="font-size: 18px; margin-top: 0;">Hi <strong>{patient_name}</strong>,</p>
                    
                    <div class="success-banner">
                        ✨ Your Appointment is Confirmed!
                    </div>
                    
                    <div class="details-card">
                        <h2>📋 Appointment Details</h2>
                        <div class="detail-row"><span class="detail-label">👨‍⚕️ Doctor:</span> <span class="detail-value">{details.get('doctorName')}</span></div>
                        <div class="detail-row"><span class="detail-label">🩺 Specialty:</span> <span class="detail-value">{details.get('speciality')}</span></div>
                        <div class="detail-row"><span class="detail-label">📅 Date:</span> <span class="detail-value">{details.get('date')}</span></div>
                        <div class="detail-row"><span class="detail-label">🕒 Time:</span> <span class="detail-value">{details.get('time')}</span></div>
                        <div class="detail-row"><span class="detail-label">💰 Fee:</span> <span class="detail-value">₹{details.get('fee')}</span></div>
                        <div class="detail-row"><span class="detail-label">🏥 Hospital:</span> <span class="detail-value">{hospital_name}</span></div>
                    </div>
                    
                    <div class="token-box">
                        <p>Your Token Number</p>
                        <h1>#{details.get('tokenNumber', 'N/A')}</h1>
                        <p style="font-size: 12px; color: #cbd5e1; margin-top: 5px; text-transform: none; letter-spacing: normal;">Show this token at the reception</p>
                    </div>

                    <div class="info-box">
                        <p style="margin: 0 0 10px 0; font-weight: 700; color: #b45309;">⚠️ Important Information:</p>
                        <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
                            <li style="margin-bottom: 5px;">Please arrive 15 minutes before your appointment</li>
                            <li style="margin-bottom: 5px;">Bring any relevant medical records or reports</li>
                            <li>Carry a valid ID proof</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="https://maps.google.com/?q={details.get('hospitalLocation', 'Hospital')}" class="btn">📍 Get Directions</a>
                    </div>

                    <div class="footer">
                        <p>© 2026 MediChain+. All rights reserved.</p>
                        <p>If you have any questions, please contact our support team.</p>
                    </div>
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
                <h1 style="margin: 0; font-size: 24px;">🏥 MedClues+</h1>
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
