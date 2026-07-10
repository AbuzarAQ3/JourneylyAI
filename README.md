# JourneylyAI

JourneylyAI is an travel planning platform that helps users create, organize, and visualize trips through an interactive planning studio. The application combines intelligent recommendations, weather foresight, and map-based itinerary planning to make travel planning simpler and more reliable.

> **Status:** 🚧 Active Development

---

## Features

*  Interactive map-based Journey Studio
*  Trip node visualization
*  Weather foresight
*  Trip Index and intelligent warnings
*  Content-based trip recommendation system
*  Secure authentication & user management
*  Responsive and modern UI

---

## Tech Stack

### Backend

* Django
* Django REST Framework
* PostgreSQL

### Frontend

* HTMX
* HTML5
* CSS3
* Tailwind CSS
* JavaScript

---

## Project Structure

```text
JourneylyAI/
│── backend/
│── media/
│── static/
│── templates/
│── requirements.txt
│── manage.py
└── README.md
```

---

## Running Locally

```bash
git clone https://github.com/AbuzarAQ3/journeylyAI.git

cd journeylyAI

python -m venv venv

venv\Scripts\activate
# Windows
source venv/bin/activate
# Linux(deb based)

pip install -r requirements.txt

Set up the Environment Variables
Create a `.env` file in the root directory (or copy from `.env.example`) and add your local configuration:
```env

Database Setup
1. Open your PostgreSQL terminal or GUI tool (like pgAdmin/DBeaver).
2. Create a new database matching your `.env` file:
   ```sql
   CREATE DATABASE your_db_name;
<<<<<<< HEAD
   ```

### Google OAuth Setup (OPTIONAl)
=======

Google OAuth Setup (OPTIONAl)
>>>>>>> 2572d9914a2930b637edd85e5d867b24075532e5
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google+ API**
4. Create OAuth 2.0 credentials
5. Add `http://localhost:8000/accounts/google/login/callback/` as a redirect URI
6. Copy the Client ID and Secret to your `.env` file
7. Set SOCIALACCOUNT_ENABLED = True 

python manage.py migrate

python manage.py runserver
Visit `http://127.0.0` where the API will be live at. You can access the DRF browsable API or the Django admin panel at `/admin/`.

### Docker Setup Build and Start the Containers
Run the following command to download images, build the custom Django image, and start both services in detached (background) mode:
```bash
docker compose up --build -d

docker compose exec web python manage.py migrate
docker compose logs -f django-web # logs

Visit Nginx: http://localhost:8001

docker compose down # stop container

```

```

---
