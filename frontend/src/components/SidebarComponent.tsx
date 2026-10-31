import { NavLink, useNavigate } from "react-router-dom";
import Brand from "./Brand";
export default function SidebarComponent() {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <Brand />
      <div className="sidebar-label">YOUR WORKSPACE</div>
      <nav aria-label="Workspace">
        <NavLink to="/app" end>
          <span aria-hidden="true">▦</span>My decks
        </NavLink>
        <NavLink to="/deck/shared">
          <span aria-hidden="true">◎</span>Discover decks
        </NavLink>
        <NavLink to="/deck/new">
          <span aria-hidden="true">＋</span>Create a deck
        </NavLink>
      </nav>
      <div className="sidebar-bottom">
        <p>
          A little practice.
          <br />
          <strong>A little more possibility.</strong>
        </p>
        <button
          className="text-button"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          Sign out ↗
        </button>
      </div>
    </aside>
  );
}
