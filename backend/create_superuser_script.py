
import os
import django
import sys

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusorbit.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

def create_superuser():
    # Credentials
    email = "admin@campusorbit.com"
    password = "adminpassword123"

    print(f"--- AUTH SETUP: Checking Superuser {email} ---")

    # Check Database Type
    db_engine = settings.DATABASES['default']['ENGINE']
    print(f"Database Engine: {db_engine}")

    try:
        user, created = User.objects.get_or_create(email=email)
        
        if created:
            # Only set password for NEW users
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.role = 'platform_admin'
            user.save()
            print(f"SUCCESS: Created new superuser '{email}'")
        else:
            # EMERGENCY FIX: Force Password Reset for this deploy
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.save()
            print(f"SUCCESS: EMERGENT: Reset password for '{email}' to default.")
            
    except Exception as e:
        print(f"ERROR: Failed to configure superuser. Reason: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_superuser()
