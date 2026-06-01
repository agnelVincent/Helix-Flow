/**
 * Reusable form submit button with built-in loading spinner state.
 *
 * Props:
 *   loading  {boolean}   - When true, shows spinner and disables button
 *   children {ReactNode} - Button label text
 *   style    {object}    - Optional extra inline styles
 */

export default function SubmitButton({ loading, children, style = {} }) {
  return (
    <button
      type="submit"
      className="btn btn-primary w-full"
      disabled={loading}
      style={{ height: 44, marginTop: 8, ...style }}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}