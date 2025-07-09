from fastapi import FastAPI
from routes import multi_agent_routes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Replace this value with the IP whitelist in production
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(multi_agent_routes.router, prefix="/api")