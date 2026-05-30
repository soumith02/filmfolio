from openai import OpenAI
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Create the OpenAI client using your API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# We use the cheap, fast model for most tasks
MODEL = "gpt-4o-mini"


def generate_taste_dna(logs: list) -> str:
    """Analyze a user's movie logs and generate a 'taste DNA' profile."""

    if not logs or len(logs) == 0:
        return "Log a few movies first, and I'll analyze your unique film taste!"

    # Build a summary of the user's logged movies for the AI to analyze
    movie_summary = ""
    for log in logs:
        rating = log.rating if log.rating else "no rating"
        review = log.review if log.review else "no review"
        movie_summary += f"- {log.title} ({log.release_date}): rated {rating}/10. Review: {review}\n"

    prompt = f"""You are a film taste analyst. Below is a list of movies a user has logged, with their ratings and reviews.

Analyze their taste and write a fun, insightful "Taste DNA" profile in 3-4 sentences. Be specific and personal. Mention patterns you notice in genres, eras, directors, themes, or what they rate highly vs poorly. Write directly to the user using "you". Be warm and a little playful, like a knowledgeable friend.

User's logged movies:
{movie_summary}

Write only the Taste DNA profile, nothing else."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.8
    )

    return response.choices[0].message.content.strip()

def mood_to_search_terms(mood: str) -> dict:
    """Convert a user's mood description into movie search suggestions."""

    prompt = f"""A user described what they're in the mood to watch: "{mood}"

Based on this, suggest 3 specific, real, well-known movies that match their mood perfectly. For each movie, give the exact title, the release year, and one short sentence on why it fits their mood. Only suggest real movies you are confident exist.

Respond ONLY with valid JSON in exactly this format (no markdown, no extra text):
{{"movies": [{{"title": "Movie Name", "year": "YYYY", "reason": "why it fits"}}, {{"title": "Movie Name", "year": "YYYY", "reason": "why it fits"}}, {{"title": "Movie Name", "year": "YYYY", "reason": "why it fits"}}]}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=400,
        temperature=0.7
    )

    import json
    raw = response.choices[0].message.content.strip()
    # Remove markdown code fences if the model added them
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"movies": []}
    
def score_review_quality(review_text: str) -> dict:
    """Analyze a movie review and score its quality and thoughtfulness."""

    prompt = f"""You are analyzing the quality of a movie review. Here is the review:

"{review_text}"

Evaluate it on these factors: depth of insight, specificity, and effort. Decide if it reads like a thoughtful human review, a low-effort comment, or possibly AI-generated/spam.

Respond ONLY with valid JSON in exactly this format (no markdown, no extra text):
{{"score": <number 1-10>, "category": "<thoughtful|low-effort|likely-spam>", "feedback": "<one short sentence explaining the score>"}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.3
    )

    import json
    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"score": 0, "category": "unknown", "feedback": "Could not analyze review"}
    

def generate_blend_summary(user_a: str, user_b: str, shared_movies: list, compatibility: int) -> str:
    """Generate an AI summary of two users' shared movie taste."""

    if not shared_movies:
        return f"You and {user_b} haven't watched any of the same movies yet. Time to start a watch party!"

    # Build a summary of shared movies for the AI
    summary_text = ""
    for movie in shared_movies[:15]:  # cap at 15 to keep prompt short
        you_r = movie.get("your_rating") or "no rating"
        them_r = movie.get("their_rating") or "no rating"
        summary_text += f"- {movie['title']}: {user_a} rated {you_r}/10, {user_b} rated {them_r}/10\n"

    prompt = f"""You are analyzing the shared movie taste of two friends: {user_a} and {user_b}. They have a {compatibility}% compatibility score based on the movies they've both watched and rated.

Their shared movies:
{summary_text}

Write a fun, insightful 2-3 sentence summary of their shared taste. Mention specific patterns you notice (genres they agree on, where they disagree, what kind of film duo they are). Be warm and playful, like a friend describing their movie taste. Use their actual usernames.

Write only the summary, nothing else."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=250,
        temperature=0.8
    )

    return response.choices[0].message.content.strip()


def generate_for_you_recommendations(logs: list) -> list:
    """Generate personalized movie recommendations based on user's logs."""
    if not logs or len(logs) < 1:
        return []

    # Build a summary of what the user likes
    favorites = []
    for log in logs:
        if log.rating and log.rating >= 7:
            favorites.append(log.title)

    watched_titles = [log.title for log in logs]

    if not favorites:
        favorites = watched_titles[:5]

    prompt = f"""Based on a movie lover's favorite films, recommend 8 movies they should watch next.

Their favorite movies (rated highly): {", ".join(favorites[:10])}
Movies they've already seen (do NOT recommend these): {", ".join(watched_titles[:30])}

Recommend 8 movies they haven't seen that match their taste. Mix popular and lesser-known films.

Return ONLY valid JSON, no other text:
{{
  "recommendations": [
    {{"title": "Movie Name", "year": "2010", "reason": "Brief reason"}}
  ]
}}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.8,
            response_format={"type": "json_object"}
        )
    except Exception as e:
        print(f"OpenAI error in for-you: {e}")
        return []

    try:
        result = json.loads(response.choices[0].message.content)
        recs = result.get("recommendations", [])
        print(f"AI returned {len(recs)} recommendations")

        # Enrich each recommendation with TMDB data
        from tmdb import search_movies
        enriched = []
        for rec in recs:
            try:
                search_results = search_movies(rec["title"])
                if search_results:
                    best_match = search_results[0]
                    year = rec.get("year", "")
                    if year:
                        for movie in search_results:
                            if movie.get("release_date", "").startswith(str(year)):
                                best_match = movie
                                break
                    enriched.append({
                        "tmdb_id": best_match["tmdb_id"],
                        "title": best_match["title"],
                        "poster_url": best_match["poster_url"],
                        "release_date": best_match["release_date"],
                        "reason": rec.get("reason", "")
                    })
            except Exception as inner_e:
                print(f"Error enriching {rec.get('title')}: {inner_e}")
                continue

        print(f"Enriched to {len(enriched)} movies")
        return enriched
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        return []