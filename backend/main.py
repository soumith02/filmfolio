from fastapi.security import OAuth2PasswordRequestForm
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from security import hash_password, verify_password, create_access_token
import models
import schemas
import tmdb
from auth import get_current_user


# Create all tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FilmFolio API", version="0.1.0")


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