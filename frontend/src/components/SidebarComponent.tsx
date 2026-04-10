import { Link } from "react-router-dom";

function SidebarComponent() {
  return (
    <div className="hidden md:flex flex-col w-64 bg-gray-800">
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <span className="text-white font-bold uppercase">Anki-my</span>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 bg-gray-800">
          <Link
            to="/"
            className="flex items-center px-4 py-2 mt-2 text-gray-100 hover:bg-gray-700"
          >
            <svg
              className="h-6 w-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Dashboard
          </Link>

          <Link
            to="/deck/shared"
            className="flex items-center px-4 py-2 mt-2 text-gray-100 hover:bg-gray-700"
          >
            <svg
              className="h-6 w-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Shared Decks
          </Link>

          <Link
            to="/deck/new"
            className="flex items-center px-4 py-2 mt-2 text-gray-100 hover:bg-gray-700"
          >
            <svg
              className="h-6 w-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            New Deck
          </Link>

          <Link
            to="/login"
            className="flex items-center px-4 py-2 mt-2 text-gray-100 hover:bg-gray-700"
          >
            <svg
              className="h-6 w-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12H3m0 0l4-4m-4 4l4 4m13-7v10a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2h7"
              />
            </svg>
            Logout
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default SidebarComponent;
