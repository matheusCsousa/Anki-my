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
}
export type Grade = "again" | "hard" | "good" | "easy";
