from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load secrets from .env file
load_dotenv()

# Get the database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

# Create the engine (the actual connection to the database)
engine = create_engine(DATABASE_URL)

# SessionLocal is a "session factory"
# Each time we want to talk to the database, we create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is what all our database models will inherit from
Base = declarative_base()


# Dependency: gives us a database session when we need one
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()