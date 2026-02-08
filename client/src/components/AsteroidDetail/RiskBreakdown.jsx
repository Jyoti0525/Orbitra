/**
 * RiskBreakdown Component
 * Visual breakdown of the 3 risk factors contributing to total risk score:
 * - Hazardous Status (40%)
 * - Diameter (30%)
 * - Miss Distance (30%)
 */

export default function RiskBreakdown({ asteroid }) {
  // Calculate individual risk factor scores based on riskCalculator.js logic
  const isHazardous = asteroid.isHazardous || false;
  const diameterKm = asteroid.diameterMaxKm || 0;

  // Get closest approach distance
  const missDistanceKm = asteroid.closeApproaches?.[0]?.missDistanceKm
    ? parseFloat(asteroid.closeApproaches[0].missDistanceKm)
    : Infinity;

  // Calculate individual scores (matching backend riskCalculator.js)
  const hazardousScore = isHazardous ? 40 : 0;
  const diameterScore = Math.min((diameterKm / 1) * 30, 30);
  const maxDistance = 10000000; // 10 million km
  const distanceScore = Math.max(0, 30 * (1 - missDistanceKm / maxDistance));

  // Round scores for display
  const factors = [
    {
      label: 'Hazardous Classification',
      score: Math.round(hazardousScore),
      maxScore: 40,
      weight: '40%',
      description: isHazardous
        ? 'Classified as potentially hazardous by NASA'
        : 'Not classified as hazardous',
      color: hazardousScore > 0 ? '#ff6b6b' : '#7effe0'
    },
    {
      label: 'Diameter',
      score: Math.round(diameterScore),
      maxScore: 30,
      weight: '30%',
      description: `${diameterKm.toFixed(2)} km estimated max diameter`,
      color: diameterScore >= 20 ? '#ffa726' : diameterScore >= 10 ? '#63b0ff' : '#7effe0'
    },
    {
      label: 'Miss Distance',
      score: Math.round(distanceScore),
      maxScore: 30,
      weight: '30%',
      description: missDistanceKm === Infinity
        ? 'No close approach data'
        : `${(missDistanceKm / 1000000).toFixed(2)}M km closest approach`,
      color: distanceScore >= 20 ? '#ff6b6b' : distanceScore >= 10 ? '#ffa726' : '#7effe0'
    }
  ];

  const totalScore = Math.round(hazardousScore + diameterScore + distanceScore);

  return (
    <div className="risk-breakdown-card">
      <header className="risk-breakdown-header">
        <div>
          <p className="eyebrow">Risk Analysis</p>
          <h2>Score Breakdown</h2>
        </div>
        <div className="total-score" style={{ color: getRiskColor(totalScore) }}>
          {totalScore}/100
        </div>
      </header>

      <div className="risk-factors">
        {factors.map((factor, idx) => (
          <div key={idx} className="risk-factor">
            <div className="factor-header">
              <span className="factor-label">{factor.label}</span>
              <span className="factor-weight">{factor.weight}</span>
            </div>
            <div className="factor-bar-container">
              <div
                className="factor-bar-fill"
                style={{
                  width: `${(factor.score / factor.maxScore) * 100}%`,
                  backgroundColor: factor.color
                }}
              />
            </div>
            <div className="factor-footer">
              <span className="factor-score" style={{ color: factor.color }}>
                {factor.score}/{factor.maxScore}
              </span>
              <span className="factor-description">{factor.description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="risk-formula">
        <p className="formula-label">Calculation:</p>
        <p className="formula-text">
          Risk Score = Hazardous ({hazardousScore}) + Diameter ({Math.round(diameterScore)}) + Distance ({Math.round(distanceScore)}) = <strong>{totalScore}</strong>
        </p>
      </div>
    </div>
  );
}

function getRiskColor(score) {
  if (score >= 70) return '#ff6b6b';
  if (score >= 40) return '#ffa726';
  if (score >= 20) return '#63b0ff';
  return '#7effe0';
}
