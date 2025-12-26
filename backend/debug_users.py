
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "campusorbit.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("--- DEBUG: LISTING USERS ---")
users = User.objects.all()
if not users.exists():
    print("NO USERS FOUND! DB is empty.")
else:
    for u in users:
        print(f"User: {u.email} | Role: {u.role} | Active: {u.is_active} | Staff: {u.is_staff}")
print("--- END DEBUG ---")
