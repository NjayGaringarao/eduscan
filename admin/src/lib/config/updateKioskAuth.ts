"use server";

import { createClient } from "@/utils/supabase/admin";
import { put } from "@/database/config";
import { createLog } from "../log";
import { mask } from "@/utils/string";

export const updateKioskAuth = async (
  email: string,
  password: string
): Promise<{ error?: string }> => {
  const supabase = createClient();

  try {
    // 1. Delete old kiosk auth user (if exists)
    const { data: list, error: listError } =
      await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const kioskUser = list.users.find(
      (u) => u.user_metadata.account_type === "KIOSK" || u.email === email
    );

    if (kioskUser) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        kioskUser.id
      );
      if (deleteError) throw deleteError;
    }

    // 2. Create new kiosk user
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        account_type: "KIOSK",
        email,
      },
    });
    if (createError) throw createError;

    // 3. Update config table for kiosk credentials
    const { error: configError } = await put([
      { key: "kiosk.email", value: email },
      { key: "kiosk.password", value: password },
    ]);
    if (configError) throw new Error(configError);

    await createLog({
      type: "ADMIN.CONFIG",
      title: "Kiosk Auth Updated",
      description: `Kiosk's email and password has been updated to ${mask(
        email
      )} and ${mask(password)}`,
    });

    return {};
  } catch (err: any) {
    console.error("Failed to update kiosk:", err);
    return { error: err.message ?? "Unknown error" };
  }
};
