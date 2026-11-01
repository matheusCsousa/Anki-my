export interface Deck {
  id: string;
  name: string;
  is_shared: boolean;
  is_owner: boolean;
  card_count: number;
  due_count: number;
}
export interface Card {
  id: string;
  front: string;
  back: string;
  due: boolean;
  due_at: number | null;
  interval_days: number;
  review_delays: Record<Grade, number>;
}
export type Grade = "again" | "hard" | "good" | "easy";

export interface ReviewResult {
  due_at: number;
  interval_days: number;
  delay_seconds: number;
}
