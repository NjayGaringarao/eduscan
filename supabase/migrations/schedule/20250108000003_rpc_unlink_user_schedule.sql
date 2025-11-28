
drop function if exists public.unlink_user_schedule(BIGINT, TEXT[]);

CREATE OR REPLACE FUNCTION unlink_user_schedule(
    p_schedule_id BIGINT,
    p_user_ids TEXT[] DEFAULT NULL
)
RETURNS TABLE(unlinked_users_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unlinked_users_count INTEGER := 0;
BEGIN
    -- If specific user IDs are provided, unlink only those users
    IF p_user_ids IS NOT NULL AND array_length(p_user_ids, 1) > 0 THEN
        UPDATE public."user" 
        SET schedule_id = NULL 
        WHERE schedule_id = p_schedule_id 
        AND id = ANY(p_user_ids);
    ELSE
        -- If no specific user IDs provided, unlink all users from this schedule
        UPDATE public."user" 
        SET schedule_id = NULL 
        WHERE schedule_id = p_schedule_id;
    END IF;
    
    -- Get the count of users that were unlinked
    GET DIAGNOSTICS v_unlinked_users_count = ROW_COUNT;
    
    -- Return the count of unlinked users
    RETURN QUERY SELECT v_unlinked_users_count;
END;
$$;
