import { fetchDecks } from "../services/api";
import DeckComponent from "../components/DeckComponent";
import { useEffect, useState } from "react";
import type { Deck } from "../utils/models";

function DashboardPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const decks = await fetchDecks();
        setDecks(decks);
      } catch (error) {
        console.error("Error fetching decks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-8 p-6">
        <h1 className="text-3xl font-bold mb-2 text-white">🃏 Decks</h1>
        <p className="text-gray-200">All your study materials in one place.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-10">
        {loading ? (
          <div className="col-span-1 sm:col-span-2 flex justify-center items-center py-20">
            <div className="flex flex-col items-center space-y-4 bg-gray-800 bg-opacity-70 p-10 rounded-2xl shadow-inner backdrop-blur-sm">
              <div className="relative">
                <svg
                  className="animate-spin h-12 w-12 text-indigo-400"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                {/* Optional subtle glow */}
                <div className="absolute inset-0 rounded-full blur-md bg-indigo-500 opacity-20"></div>
              </div>
              <p className="text-white text-lg font-medium animate-pulse">
                Loading your decks...
              </p>
            </div>
          </div>
        ) : decks.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 flex justify-center">
            <div className="bg-gray-900 border border-gray-600 rounded-xl p-6 shadow-md w-full max-w-md text-center">
              <p className="text-gray-300 text-lg">No decks available</p>
            </div>
          </div>
        ) : (
          decks.map((deck) => <DeckComponent key={deck.id} deck={deck} />)
        )}
      </div>
    </>
  );
}

export default DashboardPage;
