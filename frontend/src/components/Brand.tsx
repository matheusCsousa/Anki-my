import { Link } from "react-router-dom";
export default function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="brand-icon" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      Anki<span className="brand-light">my</span>
    </Link>
  );
}
