import { useEffect, useState } from "react";
import DeckComponent from "../components/DeckComponent";
import { Deck } from "../utils/models";
import { fetchSharedDecks } from "../services/api";

const SharedDecksPage = () => {
  const [search, setSearch] = useState("");
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [filteredDecks, setFilteredDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const decks = await fetchSharedDecks();
        setAllDecks(decks);
        setFilteredDecks(decks);
      } catch (error) {
        console.error("Error fetching shared decks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setFilteredDecks(
      allDecks.filter((deck) =>
        deck.name.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [search, allDecks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
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
              <div className="absolute inset-0 rounded-full blur-md bg-indigo-500 opacity-20"></div>
            </div>
            <p className="text-white text-lg font-medium animate-pulse">
              Loading your decks...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">📚 Shared Decks</h1>
        <p className="text-gray-400">
          Explore and study decks shared by the community
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search decks..."
          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Deck Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-10">
        {filteredDecks.length > 0 ? (
          filteredDecks.map((deck) => (
            <DeckComponent key={deck.id} deck={deck} />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400">
            <div className="col-span-1 sm:col-span-2 flex justify-center">
              <div className="bg-gray-900 border border-gray-600 rounded-xl p-6 shadow-md w-full max-w-md text-center">
                <p className="text-gray-300 text-lg">No decks found</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedDecksPage;
