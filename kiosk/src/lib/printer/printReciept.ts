import { Command } from "@tauri-apps/plugin-shell";

export const printReciept = async (
  referenceId: string | number,
  activity: string,
  userId: string,
  name: string,
  date: string,
  time: string
) => {
  const cmd = Command.sidecar("binaries/reciept_printer", [
    "--reference_id",
    String(referenceId),
    "--activity",
    activity,
    "--user_id",
    userId,
    "--name",
    name,
    "--date",
    date,
    "--time",
    time,
  ]);
  await cmd.execute().catch();
};
