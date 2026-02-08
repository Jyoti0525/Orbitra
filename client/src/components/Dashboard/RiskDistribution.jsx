export default function RiskDistribution({ riskDistribution }) {
  if (!riskDistribution) return null;

  const categories = [
    { key: 'low', label: 'Low (0-19)', bgColor: '#4caf50', textColor: '#4caf50' },
    { key: 'medium', label: 'Medium (20-39)', bgColor: '#ffa726', textColor: '#ffa726' },
    { key: 'high', label: 'High (40-69)', bgColor: '#ff6b6b', textColor: '#ff6b6b' },
    { key: 'critical', label: 'Critical (70+)', bgColor: '#63b0ff', textColor: '#63b0ff' },
  ];

  const total = Object.values(riskDistribution).reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...Object.values(riskDistribution));

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Risk Distribution</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {categories.map(({ key, label, bgColor, textColor }) => {
          const count = riskDistribution[key] || 0;
          const percentage = total > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '8rem', fontSize: '0.85rem', color: 'var(--detail-muted)' }}>{label}</div>
              <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', height: '1.5rem', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    background: `linear-gradient(90deg, ${bgColor}dd, ${bgColor})`,
                    height: '100%',
                    width: `${percentage}%`,
                    transition: 'width 0.5s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '0.5rem'
                  }}
                >
                  {count > 0 && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff' }}>{count}</span>
                  )}
                </div>
              </div>
              <div style={{ width: '3rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: 'bold', color: textColor }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--detail-border)', textAlign: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--detail-muted)' }}>Total: </span>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent2)' }}>{total}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--detail-muted)' }}> asteroids today</span>
      </div>
    </div>
  );
}
