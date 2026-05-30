from fastapi.security import OAuth2PasswordRequestForm
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from security import hash_password, verify_password, create_access_token
import models
import schemas
import tmdb
import ai_service
from fastapi.middleware.cors import CORSMiddleware
from auth import get_current_user


# Create all tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FilmFolio API", version="0.1.0")

# Allow the frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to FilmFolio API"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "filmfolio-api"}


@app.post("/signup", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user account."""

    existing_username = db.query(models.User).filter(
        models.User.username == user.username
    ).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    existing_email = db.query(models.User).filter(
        models.User.email == user.email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_pwd = hash_password(user.password)

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd,
        full_name=user.full_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Log in a user and return a JWT token."""

    user = db.query(models.User).filter(
        models.User.username == form_data.username
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    access_token = create_access_token(data={"sub": user.username, "user_id": user.id})

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/movies/search")
def search_movies(query: str):
    """Search for movies by title using TMDB."""
    if not query or len(query.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty"
        )
    try:
        results = tmdb.search_movies(query)
        return {"query": query, "results": results}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Error fetching movies from TMDB"
        )


@app.get("/movies/{tmdb_id}")
def movie_details(tmdb_id: int):
    """Get detailed information about a specific movie."""
    try:
        details = tmdb.get_movie_details(tmdb_id)
        return details
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found"
        )
    
@app.get("/me", response_model=schemas.UserResponse)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    """Get the profile of the currently logged-in user."""
    return current_user


@app.post("/logs", response_model=schemas.MovieLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(
    log: schemas.MovieLogCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a movie the current user has watched."""
    new_log = models.MovieLog(
        user_id=current_user.id,
        tmdb_id=log.tmdb_id,
        title=log.title,
        poster_url=log.poster_url,
        release_date=log.release_date,
        rating=log.rating,
        review=log.review
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@app.get("/logs", response_model=list[schemas.MovieLogResponse])
def get_my_logs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all movie logs for the current user."""
    logs = db.query(models.MovieLog).filter(
        models.MovieLog.user_id == current_user.id
    ).order_by(models.MovieLog.watched_date.desc()).all()
    return logs


@app.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete one of the current user's movie logs."""
    log = db.query(models.MovieLog).filter(
        models.MovieLog.id == log_id,
        models.MovieLog.user_id == current_user.id
    ).first()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log not found"
        )

    db.delete(log)
    db.commit()
    return None

@app.get("/ai/taste-dna")
def get_taste_dna(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an AI 'Taste DNA' profile based on the user's logged movies."""

    # Get all the user's logs
    logs = db.query(models.MovieLog).filter(
        models.MovieLog.user_id == current_user.id
    ).all()

    # Generate the AI analysis
    taste_dna = ai_service.generate_taste_dna(logs)

    return {
        "username": current_user.username,
        "movies_analyzed": len(logs),
        "taste_dna": taste_dna
    }

@app.get("/ai/mood-search")
def mood_search(
    mood: str,
    current_user: models.User = Depends(get_current_user)
):
    """Recommend movies based on a mood description in plain English."""

    if not mood or len(mood.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please describe your mood"
        )

    # Ask AI for movie suggestions based on mood
    ai_result = ai_service.mood_to_search_terms(mood)

    # For each AI suggestion, look it up on TMDB to get real poster/details
    enriched = []
    for suggestion in ai_result.get("movies", []):
        title = suggestion.get("title", "")
        reason = suggestion.get("reason", "")
        year = suggestion.get("year", "")
        # Search TMDB for this title
        tmdb_results = tmdb.search_movies(title)
        if tmdb_results:
            # Try to find a result whose release year matches the AI's year
            best_match = tmdb_results[0]
            if year:
                for result in tmdb_results:
                    release = result.get("release_date") or ""
                    if release.startswith(str(year)):
                        best_match = result
                        break
            best_match["reason"] = reason
            enriched.append(best_match)

    return {
        "mood": mood,
        "recommendations": enriched
    }

@app.get("/ai/score-review")
def score_review(
    review: str,
    current_user: models.User = Depends(get_current_user)
):
    """Score the quality of a movie review using AI."""

    if not review or len(review.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review text cannot be empty"
        )

    result = ai_service.score_review_quality(review)

    return {
        "review": review,
        "analysis": result
    }
@app.get("/blend/{other_username}")
def blend_with_user(
    other_username: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare your movie taste with another user and generate a Blend."""

    # Cant blend with yourself
    if other_username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot blend with yourself"
        )

    # Find the other user
    other_user = db.query(models.User).filter(
        models.User.username == other_username
    ).first()

    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{other_username}' not found"
        )

    # Get all logs for both users
    my_logs = db.query(models.MovieLog).filter(
        models.MovieLog.user_id == current_user.id
    ).all()
    their_logs = db.query(models.MovieLog).filter(
        models.MovieLog.user_id == other_user.id
    ).all()

    if not my_logs or not their_logs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both users need to log at least one movie to Blend"
        )

    # Build lookup dicts: tmdb_id -> log
    my_movies = {log.tmdb_id: log for log in my_logs}
    their_movies = {log.tmdb_id: log for log in their_logs}

    # Find movies BOTH watched
    shared_ids = set(my_movies.keys()) & set(their_movies.keys())

    # Calculate compatibility from rating similarity on shared movies
    rating_diffs = []
    shared_movies_data = []
    hot_takes = []
    for tmdb_id in shared_ids:
        my_log = my_movies[tmdb_id]
        their_log = their_movies[tmdb_id]
        diff_value = None
        if my_log.rating and their_log.rating:
            diff_value = abs(my_log.rating - their_log.rating)
            rating_diffs.append(diff_value)

        movie_data = {
            "tmdb_id": tmdb_id,
            "title": my_log.title,
            "poster_url": my_log.poster_url,
            "your_rating": my_log.rating,
            "their_rating": their_log.rating,
            "rating_diff": diff_value
        }
        shared_movies_data.append(movie_data)

        # Hot take = rating difference of 3 or more
        if diff_value is not None and diff_value >= 3:
            hot_takes.append(movie_data)

    # Sort hot takes by biggest disagreement first
    hot_takes.sort(key=lambda m: m["rating_diff"], reverse=True)

    # Compatibility score: 100 if all ratings match, lower as differences grow
    if rating_diffs:
        avg_diff = sum(rating_diffs) / len(rating_diffs)
        # Convert: 0 diff = 100%, 10 diff = 0%
        compatibility = max(0, round(100 - (avg_diff * 10)))
    else:
        # No shared rated movies, base it on having any shared at all
        compatibility = 50 if shared_ids else 20

    # Build the recommended watchlist:
    # Movies THEY rated highly (>=7) that YOU havent watched, and vice versa
    your_watchlist = []
    for tmdb_id, log in their_movies.items():
        if tmdb_id not in my_movies and log.rating and log.rating >= 7:
            your_watchlist.append({
                "tmdb_id": tmdb_id,
                "title": log.title,
                "poster_url": log.poster_url,
                "recommended_by": other_username,
                "their_rating": log.rating
            })

    their_watchlist = []
    for tmdb_id, log in my_movies.items():
        if tmdb_id not in their_movies and log.rating and log.rating >= 7:
            their_watchlist.append({
                "tmdb_id": tmdb_id,
                "title": log.title,
                "poster_url": log.poster_url,
                "recommended_by": current_user.username,
                "your_rating": log.rating
            })
    # Combined watchlist: movies in BOTH users' watchlists
    my_wl = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id
    ).all()
    their_wl = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == other_user.id
    ).all()

    my_wl_dict = {w.tmdb_id: w for w in my_wl}
    their_wl_ids = {w.tmdb_id for w in their_wl}
    combined_wl_ids = set(my_wl_dict.keys()) & their_wl_ids

    combined_watchlist = []
    for tmdb_id in combined_wl_ids:
        item = my_wl_dict[tmdb_id]
        combined_watchlist.append({
            "tmdb_id": item.tmdb_id,
            "title": item.title,
            "poster_url": item.poster_url,
            "release_date": item.release_date
        })

    # AI taste summary of the blend
    blend_summary = ai_service.generate_blend_summary(
        current_user.username,
        other_user.username,
        shared_movies_data,
        compatibility
    )

    return {
        "you": current_user.username,
        "them": other_username,
        "compatibility_score": compatibility,
        "shared_movies_count": len(shared_ids),
        "shared_movies": shared_movies_data,
        "hot_takes": hot_takes,
        "combined_watchlist": combined_watchlist,
        "watchlist_for_you": your_watchlist[:10],
        "watchlist_for_them": their_watchlist[:10],
        "blend_summary": blend_summary
    }
# Watchlist endpoints 

@app.post("/watchlist", response_model=schemas.WatchlistOut)
def add_to_watchlist(
    item: schemas.WatchlistCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a movie to the user's watchlist."""

    existing = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id,
        models.Watchlist.tmdb_id == item.tmdb_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movie already in watchlist"
        )

    new_item = models.Watchlist(
        user_id=current_user.id,
        tmdb_id=item.tmdb_id,
        title=item.title,
        poster_url=item.poster_url,
        release_date=item.release_date
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.get("/watchlist", response_model=list[schemas.WatchlistOut])
def get_watchlist(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's watchlist."""
    items = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id
    ).order_by(models.Watchlist.added_at.desc()).all()
    return items


@app.delete("/watchlist/{item_id}")
def remove_from_watchlist(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a movie from the watchlist."""
    item = db.query(models.Watchlist).filter(
        models.Watchlist.id == item_id,
        models.Watchlist.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist"}


# ====== Follow endpoints ======

@app.get("/users/search")
def search_users(
    query: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for users by username (partial match)."""
    if len(query) < 2:
        return {"users": []}

    users = db.query(models.User).filter(
        models.User.username.ilike(f"%{query}%"),
        models.User.id != current_user.id
    ).limit(20).all()

    # For each user, check if current user is following them
    following_ids = {
        f.following_id for f in db.query(models.Follow).filter(
            models.Follow.follower_id == current_user.id
        ).all()
    }

    results = [
        {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "is_following": u.id in following_ids
        }
        for u in users
    ]
    return {"users": results}


@app.post("/follow/{username}")
def follow_user(
    username: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follow another user."""
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    target = db.query(models.User).filter(models.User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id,
        models.Follow.following_id == target.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already following")

    new_follow = models.Follow(
        follower_id=current_user.id,
        following_id=target.id
    )
    db.add(new_follow)
    db.commit()
    return {"message": f"Following {username}"}


@app.delete("/follow/{username}")
def unfollow_user(
    username: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user."""
    target = db.query(models.User).filter(models.User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    follow = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id,
        models.Follow.following_id == target.id
    ).first()
    if not follow:
        raise HTTPException(status_code=400, detail="Not following this user")

    db.delete(follow)
    db.commit()
    return {"message": f"Unfollowed {username}"}


@app.get("/me/following")
def get_my_following(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List users the current user is following."""
    follows = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id
    ).all()
    user_ids = [f.following_id for f in follows]
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all() if user_ids else []
    return {"following": [{"username": u.username, "full_name": u.full_name} for u in users]}


@app.get("/me/followers")
def get_my_followers(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List users following the current user."""
    follows = db.query(models.Follow).filter(
        models.Follow.following_id == current_user.id
    ).all()
    user_ids = [f.follower_id for f in follows]
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all() if user_ids else []
    return {"followers": [{"username": u.username, "full_name": u.full_name} for u in users]}


@app.get("/feed")
def get_friends_feed(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent movie logs from users the current user follows."""
    follows = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id
    ).all()
    following_ids = [f.following_id for f in follows]

    if not following_ids:
        return {"feed": []}

    # Get recent logs from followed users
    recent_logs = db.query(models.MovieLog).filter(
        models.MovieLog.user_id.in_(following_ids)
    ).order_by(models.MovieLog.created_at.desc()).limit(50).all()

    # Build user lookup
    users = db.query(models.User).filter(models.User.id.in_(following_ids)).all()
    user_map = {u.id: u.username for u in users}

    feed = [
        {
            "id": log.id,
            "username": user_map.get(log.user_id, "unknown"),
            "tmdb_id": log.tmdb_id,
            "title": log.title,
            "poster_url": log.poster_url,
            "release_date": log.release_date,
            "rating": log.rating,
            "review": log.review,
            "watched_date": log.watched_date.isoformat() if log.watched_date else None
        }
        for log in recent_logs
    ]
    return {"feed": feed}

# ====== Person endpoints ======

@app.get("/people/{person_id}")
def get_person(person_id: int):
    """Get a person's bio, photo, and full filmography."""
    details = tmdb.get_person_details(person_id)
    if not details:
        raise HTTPException(status_code=404, detail="Person not found")

    credits = tmdb.get_person_credits(person_id)
    if not credits:
        credits = {"acting": [], "directing": [], "writing": [], "producing": []}

    return {
        "details": details,
        "credits": credits
    }

# ====== Homepage endpoints ======

@app.get("/trending")
def get_trending():
    """Get trending movies from TMDB."""
    movies = tmdb.get_trending_movies()
    return {"movies": movies}


@app.get("/ai/for-you")
def get_for_you(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-personalized recommendations for the current user."""
    logs = db.query(models.MovieLog).filter(
        models.MovieLog.user_id == current_user.id
    ).all()

    if not logs:
        return {"recommendations": [], "message": "Log some movies first to get recommendations"}

    recommendations = ai_service.generate_for_you_recommendations(logs)
    return {"recommendations": recommendations}


@app.get("/me/stats")
def get_user_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's viewing statistics."""
    logs = db.query(models.MovieLog).filter(
        models.MovieLog.user_id == current_user.id
    ).all()

    watchlist_count = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id
    ).count()

    # Calculate time spent (average movie = 110 min)
    movies_watched = len(logs)
    total_minutes = movies_watched * 110
    days = total_minutes // (24 * 60)
    hours = (total_minutes % (24 * 60)) // 60
    minutes = total_minutes % 60

    # Average rating
    rated_logs = [l for l in logs if l.rating]
    avg_rating = sum(l.rating for l in rated_logs) / len(rated_logs) if rated_logs else 0

    # Reviews count
    reviews_count = len([l for l in logs if l.review])

    return {
        "movies_watched": movies_watched,
        "watchlist_count": watchlist_count,
        "reviews_count": reviews_count,
        "avg_rating": round(avg_rating, 1),
        "time_spent": {
            "days": days,
            "hours": hours,
            "minutes": minutes,
            "total_minutes": total_minutes
        }
    }