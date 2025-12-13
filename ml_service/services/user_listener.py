from utils.face_utils import get_all_users
from utils.user_cache import set_cached_users

async def refresh_user_list():
    print("services.user_listener :: Updating User List")
    users = await get_all_users()
    set_cached_users(users)