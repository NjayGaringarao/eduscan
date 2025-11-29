from typing import List
from api.models import User

user_cache: List[User] = []

def get_cached_users() -> List[User]:
    return user_cache

def set_cached_users(users: List[User]):
    global user_cache
    user_cache = users
