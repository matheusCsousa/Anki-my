import { Outlet } from "react-router-dom";
import SidebarComponent from "../components/SidebarComponent";
export default function OutletPage() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SidebarComponent />
      <main id="main-content" className="workspace">
        <Outlet />
      </main>
    </div>
  );
}
