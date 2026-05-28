from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    bio = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    watchlist_items = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")


class MovieLog(Base):
    __tablename__ = "movie_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)

    # Movie info from TMDB (we store a copy so we don't have to refetch every time)
    tmdb_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    poster_url = Column(String(500), nullable=True)
    release_date = Column(String(20), nullable=True)

    # User's personal log data
    rating = Column(Integer, nullable=True)
    review = Column(String(2000), nullable=True)
    watched_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tmdb_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    poster_url = Column(String, nullable=True)
    release_date = Column(String, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="watchlist_items")

class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)