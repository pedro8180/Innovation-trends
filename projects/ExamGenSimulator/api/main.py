from fastapi import FastAPI
from routes import multi_agent_routes
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",  # React development server
    "http://localhost:8000",  # FastAPI server
    "*"  # Allow all origins (remove in production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Add error handler for uncaught exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "detail": "An internal server error occurred"}
    )

app.include_router(multi_agent_routes.router, prefix="/api")