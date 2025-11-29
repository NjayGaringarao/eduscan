"use server";

import { createClient } from "@/utils/supabase/admin";
import { get, put } from "@/database/config";
import { createLog } from "../log";

export const updateKioskState = async (
  state: "ENABLED" | "DISABLED"
): Promise<{ error?: string }> => {
  const supabase = createClient();

  try {
    // 1. Update config table
    const { error: configError } = await put([
      { key: "kiosk.state", value: state },
    ]);
    if (configError) throw new Error(configError);

    // 2. Handle Auth state
    if (state === "DISABLED") {
      const { data: list, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const configRes = await get(["kiosk.email"]);
      const kioskEmail = configRes.configs.find(
        (c) => c.key === "kiosk.email"
      )?.value;

      if (kioskEmail) {
        const kioskUser = list.users.find(
          (u) =>
            u.user_metadata.account_type === "KIOSK" || u.email === kioskEmail
        );

        if (kioskUser) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(
            kioskUser.id
          );
          if (deleteError) throw deleteError;
        }
      }
    }

    if (state === "ENABLED") {
      const res = await get(["kiosk.email", "kiosk.password"]);
      const email = res.configs.find((c) => c.key === "kiosk.email")?.value;
      const password = res.configs.find(
        (c) => c.key === "kiosk.password"
      )?.value;

      if (!email || !password) {
        throw new Error("Kiosk credentials not found in config");
      }

      const { data: list, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const kioskUser = list.users.find(
        (u) => u.user_metadata.account_type === "KIOSK" || u.email === email
      );

      if (!kioskUser) {
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
      }
    }

    await createLog({
      type: "ADMIN.CONFIG",
      title: `Kiosk is ${state}`,
      description: `Kiosk state is set to be ${state}.`,
    });

    return {};
  } catch (err: any) {
    console.error("Failed to update kiosk state:", err);
    return { error: err.message ?? "Unknown error" };
  }
};
