import { Route, Routes, Link } from "react-router-dom";
import "./css/App.css";
import OutletPage from "./pages/OutletPage";
import LandingPage from "./pages/LandingPage";
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
      <Route path="/" element={<LandingPage />} />
      <Route
        element={
          <ProtectedRoute>
            <OutletPage />
          </ProtectedRoute>
        }
      >
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/deck/new" element={<NewDeckPage />} />
        <Route path="/deck/shared" element={<SharedPage />} />
        <Route path="/deck/:id" element={<DeckPage />} />
        <Route path="/deck/:id/study" element={<DeckStudyPage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="*"
        element={
          <main className="empty-state">
            <h1>This page wandered off.</h1>
            <Link className="button" to="/">
              Back home
            </Link>
          </main>
        }
      />
    </Routes>
  );
}
export default App;
