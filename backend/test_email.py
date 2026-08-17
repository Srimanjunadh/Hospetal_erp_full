import os
import smtplib
from email.message import EmailMessage

def test_smtp():
    smtp_host = "smtp-relay.brevo.com"
    smtp_port = 587
    smtp_user = "ae2c4f001@smtp-brevo.com"
    smtp_pass = "fTKj4AOPqmRD0kCI"
    sender_email = "mrobito71@gmail.com"
    
    msg = EmailMessage()
    msg["From"] = f"Test <{sender_email}>"
    msg["To"] = sender_email
    msg["Subject"] = "Test Email"
    msg.set_content("This is a test email")
    
    try:
        print("Connecting to SMTP server...")
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.set_debuglevel(1)
            server.starttls()
            print("Logging in...")
            server.login(smtp_user, smtp_pass)
            print("Sending email...")
            server.send_message(msg)
            print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")

if __name__ == "__main__":
    test_smtp()
