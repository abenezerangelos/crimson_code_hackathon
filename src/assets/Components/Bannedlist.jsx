export default function Bannedlist({ labels = [], onUnban = () => {} }) {
  return (
    <aside className="banned-panel">
      <h3>Banned labels</h3>
      {labels.length === 0 ? (
        <p className="muted">No labels banned yet. Click any topic or metadata button to ban it.</p>
      ) : (
        <div className="banned-chips">
          {labels.map((label) => (
            <button key={label} className="banned-chip" onClick={() => onUnban(label)}>
              {label} ✕
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
