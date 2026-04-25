from fastapi import FastAPI
from backend.routers import jobs, crawl

app = FastAPI()
app.include_router(jobs.router)
app.include_router(crawl.router)
