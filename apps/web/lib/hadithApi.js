import { supabase } from "./supabaseClient";

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke("hadith", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export const hadithApi = {
  one: (book, number) => invoke({ action: "one", book, number }),
  range: (book, from = 1, to = 10) => invoke({ action: "range", book, from, to }),
  random: (book = "bukhari") => invoke({ action: "random", book }),
};
