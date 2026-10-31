import { Link } from "react-router-dom";
import Brand from "../components/Brand";
export default function LandingPage() {
  const signedIn = !!localStorage.getItem("token");
  return (
    <main className="landing">
      <section className="landing-top">
        <header className="landing-nav">
          <Brand />
          <nav aria-label="Main">
            <a href="#how-it-works">How it works</a>
            <Link to={signedIn ? "/app" : "/login"}>
              {signedIn ? "My decks" : "Sign in"}
            </Link>
            <Link className="button" to={signedIn ? "/app" : "/register"}>
              {signedIn ? "Open workspace" : "Get started"}
            </Link>
          </nav>
        </header>
        <div className="landing-hero">
          <span className="eyebrow">A LITTLE EVERY DAY. A LOT OVER TIME.</span>
          <h1>
            Big ideas.
            <br />
            Small cards.
            <br />
            <span>Lasting knowledge.</span>
          </h1>
          <p>
            A simple space for everything you want to remember. <br />
            Create flashcards, find your focus, and learn at your own pace.
          </p>
          <div className="landing-actions">
            <Link className="button" to={signedIn ? "/app" : "/register"}>
              Start learning →
            </Link>
            <a className="button secondary" href="#how-it-works">
              Take a look ↓
            </a>
          </div>
        </div>
        <div className="preview-caption">
          A calmer kind of practice. <span aria-hidden="true">↘</span>
        </div>
        <div
          className="product-preview"
          aria-label="Illustrative study workspace"
        >
          <div className="preview-top">
            <Brand />
            <span className="tag">A look inside</span>
          </div>
          <div className="preview-body">
            <div className="preview-sidebar">
              <strong>My decks</strong>
              <span>Discover</span>
              <span>＋ New deck</span>
            </div>
            <div className="preview-main">
              <div className="preview-heading">
                <h2>A good day to learn something.</h2>
                <span>＋ New deck</span>
              </div>
              <div className="preview-decks">
                {[
                  {
                    title: "Everyday Spanish",
                    front: "A little conversation.",
                    back: "One word at a time.",
                    color: "pink",
                  },
                  {
                    title: "Ideas worth keeping",
                    front: "Stay curious.",
                    back: "Keep making connections.",
                    color: "purple",
                  },
                  {
                    title: "The natural world",
                    front: "Look a little closer.",
                    back: "There’s always more to discover.",
                    color: "green",
                  },
                ].map((d) => (
                  <div key={d.title} className={`preview-deck ${d.color}`}>
                    <span aria-hidden="true">▤</span>
                    <h3>{d.title}</h3>
                    <p>
                      {d.front}
                      <br />
                      {d.back}
                    </p>
                    <small>Illustrative deck</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="landing-explain" id="how-it-works">
        <span className="eyebrow">LEARNING, WITH A LITTLE LESS FRICTION</span>
        <h2>
          For curious minds.
          <br />
          <span>And the things they find.</span>
        </h2>
        <div className="feature-grid">
          <article>
            <span className="feature-number">01</span>
            <h3>Make it your own.</h3>
            <p>
              Turn notes, questions, and ideas into personal decks. Add a prompt
              on one side and an answer on the other.
            </p>
          </article>
          <article>
            <span className="feature-number">02</span>
            <h3>Come back to what matters.</h3>
            <p>
              Review the cards that are due and rate how well you remembered.
              Your next review is scheduled and saved.
            </p>
          </article>
          <article>
            <span className="feature-number">03</span>
            <h3>A little shared knowledge.</h3>
            <p>
              Discover decks from the community, or share your own. Everyone
              keeps their own study progress.
            </p>
          </article>
        </div>
      </section>
      <section className="landing-cta">
        <h2>
          Your next little breakthrough
          <br />
          starts with a card.
        </h2>
        <Link className="button" to={signedIn ? "/app" : "/register"}>
          Make room for learning →
        </Link>
      </section>
      <footer className="landing-footer">
        <Brand />
        <span>An independent flashcard app. Not affiliated with Anki.</span>
        <Link to="/login">Sign in ↗</Link>
      </footer>
    </main>
  );
}
