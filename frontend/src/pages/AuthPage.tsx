import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginUser, registerUser, errorMessage } from "../services/api";
import Brand from "../components/Brand";
export default function AuthPage({ register = false }: { register?: boolean }) {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [repeat, setRepeat] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (register && password !== repeat) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await (register ? registerUser : loginUser)(
        username.trim(),
        password,
      );
      localStorage.setItem("token", result.token);
      navigate("/app");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <Brand />
      <div className="auth-layout">
        <div className="auth-message">
          <span className="eyebrow">A LITTLE PRACTICE GOES A LONG WAY</span>
          <h1>
            Make it stick.
            <br />
            <span>Make it yours.</span>
          </h1>
          <p>
            A calmer place to collect what you learn.
            <br />
            One card, one small breakthrough at a time.
          </p>
          <div className="auth-art" aria-hidden="true">
            <div>
              What will you learn today?
              <span>Curiosity is a great place to start.</span>
            </div>
          </div>
        </div>
        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          <h2>{register ? "A fresh start." : "Welcome back."}</h2>
          <p>
            {register
              ? "Create your account and start a collection."
              : "Your next study session is waiting."}
          </p>
          {params.has("expired") && (
            <p role="status">Your session ended. Please sign in again.</p>
          )}
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          <label htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={register ? 3 : 1}
            maxLength={40}
            pattern={register ? "[A-Za-z0-9_-]+" : undefined}
            title="Letters, numbers, hyphens, and underscores"
          />
          {register && (
            <small>3–40 letters, numbers, hyphens, or underscores.</small>
          )}
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={register ? 8 : 1}
            maxLength={72}
          />
          {register && (
            <>
              <small>At least 8 characters; up to 72 UTF-8 bytes.</small>
              <label htmlFor="repeat-password">Repeat password</label>
              <input
                id="repeat-password"
                type="password"
                autoComplete="new-password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                required
                maxLength={72}
              />
            </>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Just a moment…" : register ? "Create account" : "Sign in"}{" "}
            <span aria-hidden="true">→</span>
          </button>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New around here?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
