from fastapi import FastAPI
from backend.routers import jobs

app = FastAPI()
app.include_router(jobs.router)
