
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
            print(f"SUCCESS: Created new superuser '{email}' with default password.")
            print(f"⚠️  IMPORTANT: Change this password immediately after first login!")
        else:
            # PRODUCTION SAFE: Do NOT reset password for existing users
            # Only ensure permissions are correct
            needs_update = False
            if not user.is_staff:
                user.is_staff = True
                needs_update = True
            if not user.is_superuser:
                user.is_superuser = True
                needs_update = True
            if not user.is_active:
                user.is_active = True
                needs_update = True
            
            if needs_update:
                user.save()
                print(f"INFO: Updated permissions for '{email}' (password unchanged).")
            else:
                print(f"INFO: Superuser '{email}' already exists with correct permissions.")
            
    except Exception as e:
        print(f"ERROR: Failed to configure superuser. Reason: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_superuser()
