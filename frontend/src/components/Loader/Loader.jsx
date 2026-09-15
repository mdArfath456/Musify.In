import "./Loader.css";

export default function Loader({ label = "Loading" }) {
  return (
    <div className="loader">
      <div className="loader-reel" />
      <span className="eyebrow">{label}</span>
    </div>
  );
}
