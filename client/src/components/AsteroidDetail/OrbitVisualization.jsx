import { useEffect, useRef } from 'react';

export default function OrbitVisualization({ orbitalData }) {
  const dotRef = useRef(null);
  const innerOrbitRef = useRef(null);
  const outerOrbitRef = useRef(null);
  const orbitRadiiRef = useRef({ rx: 110, ry: 54 });

  useEffect(() => {
    // Use default values if no orbital data available
    const semiMajor = orbitalData?.semiMajorAxis
      ? parseFloat(orbitalData.semiMajorAxis)
      : 1.0; // Default: 1 AU (Earth-like orbit)

    const eccentricity = orbitalData?.eccentricity
      ? Math.min(0.95, Math.max(0, parseFloat(orbitalData.eccentricity)))
      : 0.1; // Default: slightly elliptical

    // Scale calculation to fit in SVG viewBox (320x240)
    const baseScale = 50;
    const maxRadius = 140; // Max radius to keep orbit in bounds

    let rx = baseScale + semiMajor * 40;
    let ry = rx * Math.sqrt(Math.max(0.05, 1 - eccentricity * eccentricity));

    // Ensure orbit stays within canvas bounds
    if (rx > maxRadius) {
      const scale = maxRadius / rx;
      rx = maxRadius;
      ry = ry * scale;
    }

    orbitRadiiRef.current = { rx, ry };

    // Update SVG ellipse dimensions
    if (innerOrbitRef.current) {
      innerOrbitRef.current.setAttribute('rx', rx.toFixed(2));
      innerOrbitRef.current.setAttribute('ry', ry.toFixed(2));
    }
    if (outerOrbitRef.current) {
      outerOrbitRef.current.setAttribute('rx', (rx * 1.2).toFixed(2));
      outerOrbitRef.current.setAttribute('ry', (ry * 1.3).toFixed(2));
    }
  }, [orbitalData]);

  useEffect(() => {
    if (!dotRef.current) return;

    const cx = 160;
    const cy = 120;
    let angle = 0;
    let animationId;

    const animate = () => {
      angle = (angle + 0.003) % (Math.PI * 2);
      const x = cx + orbitRadiiRef.current.rx * Math.cos(angle);
      const y = cy + orbitRadiiRef.current.ry * Math.sin(angle);

      if (dotRef.current) {
        dotRef.current.setAttribute('cx', x);
        dotRef.current.setAttribute('cy', y);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <div className="orbit-visual">
      <svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd374" />
            <stop offset="100%" stopColor="#ff8b37" />
          </radialGradient>
        </defs>
        {/* Sun */}
        <circle cx="160" cy="120" r="16" fill="url(#sun)" opacity="0.9" />
        {/* Inner orbit path */}
        <ellipse
          ref={innerOrbitRef}
          cx="160"
          cy="120"
          rx="110"
          ry="54"
          className="orbit-path"
        />
        {/* Outer reference orbit */}
        <ellipse
          ref={outerOrbitRef}
          cx="160"
          cy="120"
          rx="150"
          ry="80"
          className="orbit-path faint"
        />
        {/* Asteroid dot */}
        <circle ref={dotRef} r="5" className="asteroid-dot" />
      </svg>
    </div>
  );
}
