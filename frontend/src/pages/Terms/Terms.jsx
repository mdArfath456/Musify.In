import { Link } from "react-router-dom";
import "./Terms.css";

export default function Terms() {
  return (
    <main className="terms-screen">
      <article className="terms-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">M</span>
          <span>Musify</span>
        </div>
        <p className="terms-eyebrow">Musify account terms</p>
        <h1 className="auth-heading">Terms &amp; Conditions</h1>
        <p className="auth-sub">Please read these terms before creating your Musify account.</p>

        <section className="terms-section">
          <h2>Using Musify</h2>
          <p>
            You are responsible for the information you provide and for keeping your account credentials secure.
            Use Musify lawfully and do not upload or share content you do not have permission to use.
          </p>
        </section>

        <section className="terms-section">
          <h2>Content and accounts</h2>
          <p>
            Artists must own or have the necessary rights to audio and artwork they upload. We may remove content
            or restrict accounts that violate these terms, applicable law, or the rights of others.
          </p>
        </section>

        <section className="terms-section">
          <h2>Changes</h2>
          <p>
            We may update these terms as Musify evolves. Continued use of the service after an update means you
            accept the revised terms.
          </p>
        </section>

        <Link className="btn btn-primary terms-back" to="/register">
          Back to sign up
        </Link>
      </article>
    </main>
  );
}
