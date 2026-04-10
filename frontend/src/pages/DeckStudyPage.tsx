import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, Deck } from "../utils/models";
import { fetchCards } from "../services/api";

function DeckStudyPage() {
  const { state } = useLocation();
  const deck: Deck = state?.deck;

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [progress, setProgress] = useState(1);
  const [loading, setLoading] = useState(true);

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-6">
        <div className="bg-gray-800 rounded-lg shadow-lg p-10 max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">Oops!</h1>
          <p className="mb-6 text-gray-300">
            We couldn’t find the deck you’re looking for.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleAnswer = (quality: string) => {
    console.log(`User selected: ${quality}`);
    setProgress(((current + 1) / cards.length) * 100);
    setFlipped(false);

    if (current === cards.length - 1) {
      setCompleted(true);
    } else {
      const nextIndex = current + 1;
      setCurrent(nextIndex);
      setCurrentCard(cards[nextIndex]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const fetchedCards = await fetchCards(deck.id);
      if (fetchedCards.length === 0) {
        setLoading(false);
        setCompleted(true);
        return;
      }
      setCards(fetchedCards);
      setCurrentCard(fetchedCards[0]);
      setLoading(false);
    };

    fetchData();
  }, [deck.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-indigo-500 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <p>Loading cards...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white">
        <div className="w-full max-w-3xl bg-green-700 rounded-xl shadow p-8 mb-10 text-center text-xl font-medium">
          🎉 You just completed the deck! 🎉
        </div>

        <Link
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          to="/"
        >
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white">
      {/* Header */}
      <div className="w-full max-w-3xl mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Studying: {deck.name}</h1>
        <p className="text-gray-400">
          Card {current + 1} of {cards.length}
        </p>
        <div className="w-full h-2 bg-gray-700 rounded-full mt-4">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-3xl bg-gray-800 rounded-xl shadow p-8 mb-10 text-center text-xl font-medium cursor-pointer transition duration-300 hover:brightness-110"
        onClick={() => setFlipped(true)}
      >
        <p>{flipped ? currentCard?.back : currentCard?.front}</p>
        <p className="text-sm text-gray-400 mt-2">
          {!flipped && " (click to flip)"}
        </p>
      </div>

      {/* Buttons */}
      {flipped && (
        <div className="flex flex-wrap justify-center gap-4">
          <button
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
            onClick={() => handleAnswer("again")}
          >
            Again
          </button>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-lg font-semibold"
            onClick={() => handleAnswer("hard")}
          >
            Hard
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
            onClick={() => handleAnswer("good")}
          >
            Good
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            onClick={() => handleAnswer("easy")}
          >
            Easy
          </button>
        </div>
      )}
    </div>
  );
}

export default DeckStudyPage;
