import { Deck } from "../utils/models";
import { Link } from "react-router-dom";

function DeckComponent({ deck }: { deck: Deck }) {
  return (
    <Link to={`/deck/${deck.id}`} state={{ deck }}>
      <div className="group relative cursor-pointer overflow-hidden bg-gray-800 px-6 pt-6 pb-6 shadow-xl ring-1 ring-gray-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl rounded-lg">
        {/* Animated Background Hover Circle */}
        <span className="absolute top-100 left-0 h-60 w-20 rounded-full bg-slate-600 transition-all duration-300 group-hover:scale-[12] group-hover:opacity-30 z-0"></span>

        {/* Content */}
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-slate-300 group-hover:text-white transition-colors duration-300">
            {deck.name}
          </h2>
          <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors mt-2">
            Click to study this deck
          </p>
        </div>
      </div>
    </Link>
  );
}

export default DeckComponent;
