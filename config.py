import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    host: str = "127.0.0.1"
    port: int = 8000
    db_url: str = "sqlite:////tmp/voice_calc.db"

    class Config:
        env_file = ".env"

settings = Settings()
