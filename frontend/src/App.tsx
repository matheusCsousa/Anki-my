import { Route, Routes } from "react-router-dom";
import "./css/App.css";

import OutletPage from "./pages/OutletPage";
import NewDeckPage from "./pages/NewDeckPage";
import DeckPage from "./pages/DeckPage";
import SharedPage from "./pages/SharedPage";
import DashboardPage from "./pages/DashboardPage";
import DeckStudyPage from "./pages/DeckStudyPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRouteComponent";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <OutletPage />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="deck/new" element={<NewDeckPage />} />
        <Route path="deck/:id" element={<DeckPage />} />
        <Route path="deck/:id/study" element={<DeckStudyPage />} />
        <Route path="deck/shared" element={<SharedPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}

export default App;
