import { Outlet } from "react-router-dom";

import SidebarComponent from "../components/SidebarComponent";

function OutletPage() {
  return (
    <>
      <div className="flex h-screen">
        <SidebarComponent />
        <main className="flex-1 overflow-auto bg-gray-700">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default OutletPage;
