# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project used
COPY . /app/

# Collect static files
# Collect static files
RUN python manage.py collectstatic --noinput

# Run the application
CMD sh -c "python manage.py migrate && python create_superuser_script.py && python debug_users.py && gunicorn campusorbit.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120"
