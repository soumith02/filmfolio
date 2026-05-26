# FilmFolio 🎬

A modern movie tracking platform with AI-powered features. Log movies, write reviews, and discover your unique film taste DNA.

## Features (In Development)

### Core Features
- User authentication and profiles
- Movie search and detailed pages (via TMDB)
- Log watched movies with ratings and reviews
- Build personal watchlists
- Follow other users and see their activity

### Unique AI-Powered Features
- **Taste DNA Profile** - AI analyzes your ratings to reveal what makes your film taste unique
- **Mood-to-Movie Search** - Describe how you feel, get the perfect movie
- **Watch Party Compatibility** - Find films that you and a friend will both love
- **Hidden Gems Detector** - Discover underrated films matching your specific taste
- **Review Quality Score** - AI identifies thoughtful reviews vs low-effort or bot reviews

## Tech Stack

- **Backend:** Python, FastAPI, PostgreSQL
- **Frontend:** React, Next.js, Tailwind CSS
- **AI:** OpenAI API, LangChain
- **External APIs:** TMDB (movie data)
- **Deployment:** Vercel, Render, Neon

## Status

🚧 Currently in active development

## Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/filmfolio.git
cd filmfolio/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn

# Run the server
uvicorn main:app --reload
```

Visit `http://127.0.0.1:8000/docs` for interactive API documentation.

## Author

**Soumith Reddy Asani**  
Master's in Computer Science, University of Oklahoma