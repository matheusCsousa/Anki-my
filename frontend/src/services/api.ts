import type { Deck, Card, Grade } from "../utils/models";
const apiUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const token = localStorage.getItem("token");
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Could not reach the server. Please check your connection and try again.",
    );
  }
  if (!response.ok) {
    if (response.status === 401 && auth) {
      localStorage.removeItem("token");
      window.location.assign("/login?expired=1");
    }
    const messages: Record<number, string> = {
      400: "Please check the form values.",
      401: "Incorrect username or password.",
      404: "This deck or card is unavailable.",
      409: "That name is already in use.",
      413: "This request is too large.",
      422: "Please check the form values.",
      429: "Too many attempts. Please wait a minute and try again.",
    };
    throw new ApiError(
      response.status,
      messages[response.status] ||
        "Something went wrong on the server. Please try again.",
    );
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
export const loginUser = (username: string, password: string) =>
  request<{ token: string }>(
    "/login",
    { method: "POST", body: JSON.stringify({ username, password }) },
    false,
  );
export const registerUser = (username: string, password: string) =>
  request<{ token: string }>(
    "/register",
    { method: "POST", body: JSON.stringify({ username, password }) },
    false,
  );
export const fetchDecks = () => request<Deck[]>("/deck");
export const fetchSharedDecks = () => request<Deck[]>("/deck/shared");
export const fetchDeck = (id: string) =>
  request<Deck>(`/deck/${encodeURIComponent(id)}`);
export const fetchCards = (id: string) =>
  request<Card[]>(`/deck/${encodeURIComponent(id)}/card`);
export const newDeck = (name: string, is_shared = false) =>
  request<Deck>("/deck/new", {
    method: "POST",
    body: JSON.stringify({ name, is_shared }),
  });
export const saveDeck = (id: string, name: string, is_shared: boolean) =>
  request<Deck>(`/deck/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ name, is_shared }),
  });
export const deleteDeck = (id: string) =>
  request<void>(`/deck/${encodeURIComponent(id)}`, { method: "DELETE" });
export const saveCard = (
  deckId: string,
  front: string,
  back: string,
  id?: string,
) =>
  request<Card | void>(
    `/deck/${encodeURIComponent(deckId)}/card${id ? `/${encodeURIComponent(id)}` : ""}`,
    { method: id ? "PUT" : "POST", body: JSON.stringify({ front, back }) },
  );
export const deleteCard = (deckId: string, id: string) =>
  request<void>(
    `/deck/${encodeURIComponent(deckId)}/card/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
export const reviewCard = (deckId: string, id: string, grade: Grade) =>
  request<void>(
    `/deck/${encodeURIComponent(deckId)}/card/${encodeURIComponent(id)}/review`,
    { method: "POST", body: JSON.stringify({ grade }) },
  );
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
