import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.routes import router
from scoliovis.model import load_model

# Load environment variables
load_dotenv()

# Configuration
MODEL_PATH = os.getenv("MODEL_PATH", "models/keypointsrcnn_weights.pt")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    print("Starting ScrollToSco API...")
    print(f"Debug mode: {DEBUG}")
    print(f"CORS origins: {CORS_ORIGINS}")

    # Load model
    try:
        print(f"Loading model from: {MODEL_PATH}")
        load_model(MODEL_PATH)
    except FileNotFoundError as e:
        print(f"Warning: {e}")
        print("The API will start but analysis will fail until model weights are downloaded.")
        print("Download from: https://github.com/Blankeos/scoliovis-training/releases")
    except Exception as e:
        print(f"Error loading model: {e}")

    print("API ready!")
    yield

    # Shutdown
    print("Shutting down ScrollToSco API...")


# Create FastAPI application
app = FastAPI(
    title="ScrollToSco API",
    description="Spine X-ray Analysis with Keypoint RCNN",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1", tags=["analysis"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "ScrollToSco API",
        "version": "1.0.0",
        "description": "Spine X-ray Analysis for Scoliosis Detection",
        "docs": "/docs" if DEBUG else "Disabled in production",
        "endpoints": {
            "analyze": "POST /api/v1/analyze",
            "health": "GET /api/v1/health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=DEBUG
    )
