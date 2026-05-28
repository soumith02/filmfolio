import requests
from dotenv import load_dotenv
import os

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"


def search_movies(query: str):
    """Search for movies by title using TMDB."""
    url = f"{TMDB_BASE_URL}/search/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "query": query,
        "include_adult": False
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    # Clean up the results to only return what we need
    results = []
    for movie in data.get("results", []):
        results.append({
            "tmdb_id": movie.get("id"),
            "title": movie.get("title"),
            "release_date": movie.get("release_date"),
            "overview": movie.get("overview"),
            "poster_url": f"{TMDB_IMAGE_BASE}{movie.get('poster_path')}" if movie.get("poster_path") else None,
            "rating": movie.get("vote_average")
        })

    return results


def get_movie_details(tmdb_id: int):
    """Get detailed info about a specific movie."""
    url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
    params = {
        "api_key": TMDB_API_KEY,
        "append_to_response": "credits"
    }
    response = requests.get(url, params=params)
    response.raise_for_status()
    movie = response.json()

    # Extract director from crew
    director = None
    for person in movie.get("credits", {}).get("crew", []):
        if person.get("job") == "Director":
            director = person.get("name")
            break

    # Extract top 5 cast members
    cast = []
    for person in movie.get("credits", {}).get("cast", [])[:5]:
        cast.append(person.get("name"))

    return {
        "tmdb_id": movie.get("id"),
        "title": movie.get("title"),
        "release_date": movie.get("release_date"),
        "overview": movie.get("overview"),
        "poster_url": f"{TMDB_IMAGE_BASE}{movie.get('poster_path')}" if movie.get("poster_path") else None,
        "rating": movie.get("vote_average"),
        "runtime": movie.get("runtime"),
        "genres": [g.get("name") for g in movie.get("genres", [])],
        "director": director,
        "cast": cast
    }