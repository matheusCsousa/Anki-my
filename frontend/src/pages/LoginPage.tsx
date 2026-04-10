import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [submit, setSubmit] = useState(0);
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmit((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await loginUser(formData.username, formData.password);
        localStorage.setItem("token", response.token);

        const protectedRes = await fetch("http://localhost:8000/protected", {
          headers: {
            Authorization: `Bearer ${response.token}`,
          },
        });

        if (!protectedRes.ok) {
          setLoginError(true);
          setLoading(false);
          return;
        }

        navigate("/");
      } catch (error) {
        setLoginError(true);
        console.error("Login or protected fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    if (submit) {
      fetchData();
    }
  }, [submit, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="bg-gray-700 shadow-lg rounded-xl px-8 py-10 w-full max-w-sm flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Login</h1>
        {loginError && (
          <h1 className="text-2xl font-bold text-red-100 text-center">
            Invalid username <br /> or password
          </h1>
        )}

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-300 mb-1 text-center">
            Username
          </label>
          <input
            type="text"
            name="username"
            className="w-full px-4 py-2 border text-gray-100 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.username}
            onChange={(e) => {
              setFormData({ ...formData, username: e.target.value });
              setLoginError(false);
            }}
            required
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-300 mb-1 text-center">
            Password
          </label>
          <input
            type="password"
            name="password"
            className="w-full px-4 py-2 border text-gray-100 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              setLoginError(false);
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center gap-2 py-2 rounded-lg transition-colors ${
            loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
          onClick={handleSubmit}
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          )}
          {loading ? "Logging in..." : "Login"}
        </button>

        <Link to="/register" className="text-gray-300 hover:underline">
          Don't have an account? Register
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
