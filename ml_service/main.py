from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api.routes import face_match, face_encoding, performance_analytics, user_cache, dataset, model
from dotenv import load_dotenv
from utils.face_utils import get_all_users
from utils.user_cache import set_cached_users

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    users = await get_all_users()
    set_cached_users(users)
    yield
    set_cached_users([])

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(face_match.router, prefix="/api", tags=["Face Match"])
app.include_router(face_encoding.router, prefix="/api", tags=["Face Encoding"])
app.include_router(performance_analytics.router, prefix="/api", tags=["Performance Analytics"])
app.include_router(user_cache.router, prefix="/api", tags=["User Cache"])
app.include_router(dataset.router, prefix="/api", tags=["Dataset"])
app.include_router(model.router, prefix="/api", tags=["Model"])