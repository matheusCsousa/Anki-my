import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { registerUser } from "../services/api";

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    repeatPassword: "",
  });
  const [submit, setSubmit] = useState(0);
  const [usernameError, setUsernameError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.repeatPassword) {
      alert("Passwords do not match");
      return;
    } else {
      setSubmit(submit + 1);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await registerUser(
          formData.username,
          formData.password,
        );
        localStorage.setItem("token", response.token);

        const protectedRes = await fetch("http://localhost:8000/protected", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!protectedRes.ok) {
          console.error("Unauthorized access to protected route");
          return;
        }

        navigate("/");
      } catch (error) {
        setUsernameError(true);
        console.error("Login or protected fetch failed:", error);
      }
    };

    if (submit) {
      fetchData();
    }
  }, [submit]);
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-800">
      <div className="bg-gray-700 shadow-lg rounded-xl px-8 py-10 w-full max-w-sm flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">Register</h1>
        {usernameError && (
          <h1 className="text-2xl font-bold text-red-100">
            Username already exists
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
              setUsernameError(false);
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
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-300 mb-1 text-center">
            Repeat Password
          </label>
          <input
            type="password"
            name="password"
            className="w-full px-4 py-2 border text-gray-100 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.repeatPassword}
            onChange={(e) =>
              setFormData({ ...formData, repeatPassword: e.target.value })
            }
            required
          />
        </div>

        <button
          type="submit"
          disabled={
            !formData.password ||
            !formData.repeatPassword ||
            formData.password !== formData.repeatPassword
          }
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded"
          onClick={handleSubmit}
        >
          Register
        </button>

        <Link to="/login" className="text-gray-300 hover:underline">
          Already have an account? Login
        </Link>
      </div>
    </div>
  );
}

export default RegisterPage;
