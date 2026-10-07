export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label?: string; id: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        id={id} role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10,
          backgroundColor: checked ? 'var(--accent)' : 'var(--border-strong)',
          border: 'none', cursor: 'pointer', position: 'relative',
          transition: 'background-color 0.15s', flexShrink: 0, minWidth: 36,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16,
          borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.15s',
        }} />
      </button>
      {label && <label htmlFor={id} style={{ fontSize: 14, color: 'var(--fg)', cursor: 'pointer' }}>{label}</label>}
    </div>
  )
}
