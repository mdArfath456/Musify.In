import "./SearchInput.css";

// Shared search field used on both the Library (listener) and Studio
// (artist) pages, so search always looks and behaves the same everywhere.
export default function SearchInput({ value, onChange, placeholder = "Search..." }) {
    return (
        <div className="search-input">
            <svg className="search-input-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
                <line x1="13.6" y1="13.6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            {value && (
                <button type="button" className="search-input-clear" aria-label="Clear search" onClick={() => onChange("")}>
                    ×
                </button>
            )}
        </div>
    );
}