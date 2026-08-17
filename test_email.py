import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_email():
    # Read from .env file
    env_vars = {}
    env_file_path = os.path.join("backend", ".env")
    if os.path.exists(env_file_path):
        with open(env_file_path, "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    env_vars[key] = value

    smtp_server = env_vars.get("EMAIL_HOST", "smtp-relay.brevo.com")
    port = int(env_vars.get("EMAIL_PORT", 587))
    sender_email = env_vars.get("BREVO_SENDER_EMAIL", "mrobito71@gmail.com")
    username = env_vars.get("EMAIL_USER", "ae2c4f001@smtp-brevo.com")
    password = env_vars.get("EMAIL_APP_PASSWORD", "fTKj4AOPqmRD0kCI")
    
    receiver_email = "shaikjavedali19@gmail.com"

    message = MIMEMultipart("alternative")
    message["Subject"] = "Test Email from Hospital ERP System"
    message["From"] = sender_email
    message["To"] = receiver_email

    text = f"""\
    Hi Javed,
    This is a test email from your Hospital ERP System to confirm that the SMTP configuration is working correctly.
    """
    
    part1 = MIMEText(text, "plain")
    message.attach(part1)

    try:
        server = smtplib.SMTP(smtp_server, port)
        server.starttls() 
        server.login(username, password)
        server.sendmail(sender_email, receiver_email, message.as_string())
        print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email. Error: {e}")
    finally:
        server.quit()

if __name__ == "__main__":
    test_email()
