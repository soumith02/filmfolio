import requests
from dotenv import load_dotenv
import os

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w300"


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

    # Extract director(s) from crew with ids
    directors = []
    writers = []
    for person in movie.get("credits", {}).get("crew", []):
        if person.get("job") == "Director":
            directors.append({
                "id": person.get("id"),
                "name": person.get("name")
            })
        elif person.get("department") == "Writing":
            writers.append({
                "id": person.get("id"),
                "name": person.get("name")
            })

    # Extract top 8 cast members with ids and character names
    cast = []
    for person in movie.get("credits", {}).get("cast", [])[:8]:
        cast.append({
            "id": person.get("id"),
            "name": person.get("name"),
            "character": person.get("character"),
            "profile_url": f"{TMDB_PROFILE_BASE}{person.get('profile_path')}" if person.get("profile_path") else None
        })

    return {
        "tmdb_id": movie.get("id"),
        "title": movie.get("title"),
        "release_date": movie.get("release_date"),
        "overview": movie.get("overview"),
        "poster_url": f"{TMDB_IMAGE_BASE}{movie.get('poster_path')}" if movie.get("poster_path") else None,
        "rating": movie.get("vote_average"),
        "runtime": movie.get("runtime"),
        "genres": [g.get("name") for g in movie.get("genres", [])],
        "directors": directors,
        "writers": writers[:5],  # cap at top 5 writers
        "cast": cast
    }


def get_person_details(person_id: int):
    """Get a person's bio, profile photo, and basic info."""
    url = f"{TMDB_BASE_URL}/person/{person_id}"
    params = {"api_key": TMDB_API_KEY}
    response = requests.get(url, params=params)
    if response.status_code != 200:
        return None
    data = response.json()
    return {
        "id": data.get("id"),
        "name": data.get("name"),
        "biography": data.get("biography"),
        "birthday": data.get("birthday"),
        "place_of_birth": data.get("place_of_birth"),
        "known_for_department": data.get("known_for_department"),
        "profile_url": f"{TMDB_PROFILE_BASE}{data.get('profile_path')}" if data.get("profile_path") else None
    }


def get_person_credits(person_id: int):
    """Get all movies a person has worked on, separated by role."""
    url = f"{TMDB_BASE_URL}/person/{person_id}/movie_credits"
    params = {"api_key": TMDB_API_KEY}
    response = requests.get(url, params=params)
    if response.status_code != 200:
        return None
    data = response.json()

    # Build acting credits
    acting = []
    for movie in data.get("cast", []):
        acting.append({
            "tmdb_id": movie.get("id"),
            "title": movie.get("title"),
            "character": movie.get("character"),
            "release_date": movie.get("release_date"),
            "poster_url": f"{TMDB_IMAGE_BASE}{movie.get('poster_path')}" if movie.get("poster_path") else None
        })

    # Build crew credits grouped by job
    directing = []
    writing = []
    producing = []
    other_crew = []
    for movie in data.get("crew", []):
        entry = {
            "tmdb_id": movie.get("id"),
            "title": movie.get("title"),
            "job": movie.get("job"),
            "release_date": movie.get("release_date"),
            "poster_url": f"{TMDB_IMAGE_BASE}{movie.get('poster_path')}" if movie.get("poster_path") else None
        }
        job = movie.get("job", "")
        department = movie.get("department", "")
        if job == "Director":
            directing.append(entry)
        elif department == "Writing":
            writing.append(entry)
        elif department == "Production" and job in ("Producer", "Executive Producer"):
            producing.append(entry)
        else:
            other_crew.append(entry)

    # Sort each list by release date, newest first
    def sort_key(m):
        return m.get("release_date") or "0000"

    acting.sort(key=sort_key, reverse=True)
    directing.sort(key=sort_key, reverse=True)
    writing.sort(key=sort_key, reverse=True)
    producing.sort(key=sort_key, reverse=True)

    return {
        "acting": acting,
        "directing": directing,
        "writing": writing,
        "producing": producing
    }

def get_trending_movies(time_window: str = "week"):
    """Get trending movies from TMDB. time_window can be 'day' or 'week'."""
    url = f"{TMDB_BASE_URL}/trending/movie/{time_window}"
    params = {"api_key": TMDB_API_KEY}
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    results = []
    for movie in data.get("results", [])[:20]:
        results.append({
            "tmdb_id": movie.get("id"),
            "title": movie.get("title"),
            "release_date": movie.get("release_date"),
            "overview": movie.get("overview"),
            "poster_url": f"{TMDB_IMAGE_BASE}{movie.get('poster_path')}" if movie.get("poster_path") else None,
            "backdrop_url": f"https://image.tmdb.org/t/p/original{movie.get('backdrop_path')}" if movie.get("backdrop_path") else None,
            "rating": movie.get("vote_average")
        })
    return results