/**
 * Reusable labeled input field with error state.
 *
 * Props:
 *   label       {string}   - Field label text
 *   id          {string}   - Input id (links label + input for a11y)
 *   type        {string}   - Input type (default: 'text')
 *   placeholder {string}   - Placeholder text
 *   value       {string}   - Controlled value
 *   onChange    {function} - Change handler — receives raw string value
 *   error       {string}   - Error message to display below input
 */

export default function FormField({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input ${error ? 'error' : ''}`}
        autoComplete="off"
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}