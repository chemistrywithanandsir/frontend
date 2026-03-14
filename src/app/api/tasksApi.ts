import { supabase } from "../../lib/supabaseClient";

export type TodayTask = {
  id: string;
  text: string;
  done: boolean;
};

function todayDateString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getTodayKey(): string {
  return todayDateString();
}

export async function fetchTodayTasksForUser(
  userId: string,
  day: string
): Promise<TodayTask[]> {
  const { data, error } = await supabase
    .from("user_daily_tasks")
    .select("id, text, done")
    .eq("user_id", userId)
    .eq("day", day)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchTodayTasksForUser error", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    text: String(row.text ?? ""),
    done: Boolean(row.done),
  }));
}

export async function saveTodayTasksForUser(
  userId: string,
  day: string,
  tasks: TodayTask[]
): Promise<void> {
  // Simplest: delete then insert for that user/day
  const { error: delErr } = await supabase
    .from("user_daily_tasks")
    .delete()
    .eq("user_id", userId)
    .eq("day", day);

  if (delErr) {
    console.error("saveTodayTasksForUser delete error", delErr);
    // continue; we'll try inserting anyway
  }

  if (tasks.length === 0) {
    return;
  }

  const rows = tasks.map((t) => ({
    user_id: userId,
    day,
    text: t.text,
    done: t.done,
  }));

  const { error: insErr } = await supabase
    .from("user_daily_tasks")
    .insert(rows);

  if (insErr) {
    console.error("saveTodayTasksForUser insert error", insErr);
  }
}

