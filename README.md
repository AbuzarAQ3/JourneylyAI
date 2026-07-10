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

## Deployment

```bash
git clone https://github.com/AbuzarAQ3/journeylyAI.git
cd journeylyAI
```

### Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

```bash
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`) and fill in your local configuration.

### Database

Open your PostgreSQL client and create a database matching your `.env`:

```sql
CREATE DATABASE your_db_name;
```

### Google OAuth (Optional)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:8000/accounts/google/login/callback/` as a redirect URI
6. Copy the Client ID and Secret to your `.env`
7. Set `SOCIALACCOUNT_ENABLED = True` in your settings

### Run

```bash
python manage.py migrate
python manage.py runserver
```

Visit `http://127.0.0.1:8000` — the API is live. Browse the DRF browsable API or the Django admin at `/admin/`.

---

## Docker

```bash
docker compose up --build -d
```

Visit **http://localhost:8001** (Nginx proxy).

### Useful Commands

```bash
docker compose exec django-web python manage.py migrate
docker compose logs -f django-web
docker compose down
```

---