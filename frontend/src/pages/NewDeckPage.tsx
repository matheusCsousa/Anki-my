import { useState } from "react";
import { newDeck } from "../services/api";

function NewDeckPage() {
  const [deckName, setDeckName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const deck = await newDeck(deckName);
      console.log("Deck created:", deck);
      setDeckName("");
      setSuccess(true);
    } catch (err: any) {
      console.error("Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="bg-gray-800 rounded-2xl shadow-lg p-10 w-full max-w-md relative group transition-all duration-300 hover:shadow-2xl">
        {/* Glow Circle Animation */}
        <span className="absolute top-0 left-0 h-1 w-1 rounded-full bg-slate-600 transition-all duration-300 group-hover:scale-[60] group-hover:opacity-30 z-0 origin-top-left"></span>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4">
            Create a New Deck
          </h2>
          <p className="text-slate-400 mb-6">
            Give your deck a name and start adding flashcards.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={deckName}
              onChange={(e) => {
                setError("");
                setSuccess(false);
                setDeckName(e.target.value);
              }}
              placeholder="Enter deck name"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
              disabled={loading}
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-slate-600 hover:bg-slate-500 transition-all text-white font-semibold rounded-lg shadow disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Deck"}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && (
              <p className="text-green-500 text-sm">
                Deck created successfully!
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewDeckPage;
