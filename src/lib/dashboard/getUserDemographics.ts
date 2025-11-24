"use server";

import { createClient } from "@/utils/supabase/server";
import { ComparisonValue, ComparisonMode, UserSet } from "./types";

export const getUserDemographics = async (
  userSet: UserSet,
  comparison: ComparisonMode
): Promise<{
  data: ComparisonValue[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_user_demographics", {
      user_set: userSet,
      comparison: comparison,
    });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: data };
  } catch (error) {
    console.log(`lib.dashboard.getDemograhics :: ${error}`);
    return { data: [], error: `Failed to fetch data: ${error}` };
  }
};
