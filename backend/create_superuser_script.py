
import os
import django

# Set up Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusorbit.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

def create_superuser():
    # Credentials
    email = "admin@campusorbit.com"
    password = "adminpassword123"  # Change this after first login!

    if not User.objects.filter(email=email).exists():
        print(f"Creating superuser: {email}")
        try:
            # Depending on your abstract user model, fields might differ.
            # Assuming standard fields or the custom one in accounts.
            User.objects.create_superuser(
                email=email,
                password=password,
                is_active=True,
                is_staff=True,
                is_superuser=True
            )
            print("Superuser created successfully!")
        except Exception as e:
            print(f"Error creating superuser: {e}")
    else:
        print("Superuser already exists.")

if __name__ == "__main__":
    create_superuser()
