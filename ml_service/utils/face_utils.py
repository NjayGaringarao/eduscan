from api.models import User
from services.supabase import get_supabase

async def get_all_users() -> list[User]:
    supabase = get_supabase()
    users = []
    response = supabase.table("user") \
    .select("id, facial_encoding") \
    .not_.is_("facial_encoding", "null") \
    .execute()

    for item in response.data:
        users.append(User(
            id=item["id"],
            facial_encoding=item.get("facial_encoding"),
        ) 
    )
    print("LOG: User cache updated. Total User: ", len(users))

    return users


