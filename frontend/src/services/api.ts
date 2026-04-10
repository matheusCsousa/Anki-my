// import { v4 as uuidv4 } from "uuid";
import { Deck, Card } from "../utils/models";

const apiUrl = import.meta.env.VITE_API_URL;

export async function loginUser(
  username: string,
  password: string,
): Promise<any> {
  const response = await fetch(`${apiUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to login");
  }

  return await response.json();
}

export async function registerUser(
  username: string,
  password: string,
): Promise<any> {
  const response = await fetch(`${apiUrl}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to register");
  }

  return await response.json();
}

export async function fetchDecks(): Promise<Deck[]> {
  const response = await fetch(`${apiUrl}/deck`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch decks");
  }

  const data = await response.json();
  return data.map((deck: any) => new Deck(deck.id, deck.name));
}

export async function fetchSharedDecks(): Promise<Deck[]> {
  const response = await fetch(`${apiUrl}/deck/shared`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch shared decks");
  }

  const data = await response.json();
  return data.map((deck: any) => new Deck(deck.id, deck.name));
}

export async function fetchCards(deckId: string): Promise<Card[]> {
  const response = await fetch(`${apiUrl}/deck/${deckId}/card`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cards");
  }

  const data = await response.json();
  return data.map((card: any) => new Card(card.id, card.front, card.back));
}

export async function newDeck(deckName: string) {
  const response = await fetch(`${apiUrl}/deck/new`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ name: deckName }),
  });

  if (response.status === 409) {
    throw new Error("Deck already exists");
  }

  if (!response.ok) {
    throw new Error("Failed to create deck");
  }

  return await response.json();
}
