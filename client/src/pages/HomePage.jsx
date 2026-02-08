import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './HomePage.css';

// Helper Functions
const formatApproachDate = (approachDateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const approach = new Date(approachDateStr);
  approach.setHours(0, 0, 0, 0);

  const diffTime = approach - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `in ${diffDays} days`;
};

// Globe Component
function GlobeViewer() {
  const globeRef = useRef(null);
  const worldRef = useRef(null);

  useEffect(() => {
    if (!globeRef.current || typeof window.Globe !== 'function') {
      console.warn('Globe library not loaded or container not ready');
      return;
    }

    const initialize = () => {
      try {
        const world = new window.Globe(globeRef.current)
          .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
          .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
          .backgroundColor('rgba(0,0,0,0)')
          .showAtmosphere(true)
          .atmosphereColor('#7effe0')
          .atmosphereAltitude(0.18)
          .pointOfView({ lat: 20, lng: 15, altitude: 1.3 });

        const { clientWidth, clientHeight } = globeRef.current;
        world.width(clientWidth);
        world.height(clientHeight);

        const controls = world.controls();
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.15;

        if (window.THREE) {
          const globeMaterial = world.globeMaterial();
          globeMaterial.bumpScale = 6;
          globeMaterial.shininess = 35;

          new window.THREE.TextureLoader().load(
            'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png',
            (texture) => {
              globeMaterial.specularMap = texture;
              globeMaterial.specular = new window.THREE.Color('#5375ff');
            }
          );

          const directionalLight = world
            .lights()
            .find((light) => light.type === 'DirectionalLight');
          if (directionalLight) {
            directionalLight.position.set(1.5, 0.5, 1.2);
            directionalLight.intensity = 2.2;
          }

          const ambientLight = world.lights().find((light) => light.type === 'AmbientLight');
          if (ambientLight) {
            ambientLight.intensity = 0.45;
          }
        }

        globeRef.current.style.pointerEvents = 'none';
        worldRef.current = world;
      } catch (error) {
        console.error('Failed to initialize Globe:', error);
      }
    };

    initialize();

    const onResize = () => {
      if (!globeRef.current || !worldRef.current) return;
      worldRef.current.width(globeRef.current.clientWidth);
      worldRef.current.height(globeRef.current.clientHeight);
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (globeRef.current) {
        globeRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="hero-globe" aria-hidden="true">
      <div className="globe-shell">
        <div className="globe-canvas" ref={globeRef} id="globeCanvas"></div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [asteroids, setAsteroids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsteroids();

    // Hero collapse on scroll
    const heroEl = document.querySelector('.hero');
    const handleScroll = () => {
      if (!heroEl) return;
      const { top, height } = heroEl.getBoundingClientRect();
      const triggerPoint = -height * 0.3;
      heroEl.classList.toggle('hero-collapse', top < triggerPoint);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Star brighten effect with dynamic mask
    const starBrighten = document.getElementById('star-brighten');
    if (starBrighten) {
      const handleMouseMove = (e) => {
        const x = e.clientX + 'px';
        const y = e.clientY + 'px';
        starBrighten.style.setProperty('--mouse-x', x);
        starBrighten.style.setProperty('--mouse-y', y);
        starBrighten.style.opacity = '1';

        let style = document.getElementById('star-brighten-style');
        if (!style) {
          style = document.createElement('style');
          style.id = 'star-brighten-style';
          document.head.appendChild(style);
        }
        style.textContent = `
          #star-brighten::before {
            mask: radial-gradient(circle 250px at ${x} ${y}, black 0%, transparent 100%) !important;
            -webkit-mask: radial-gradient(circle 250px at ${x} ${y}, black 0%, transparent 100%) !important;
            opacity: 1 !important;
          }
        `;
      };

      const handleMouseLeave = () => {
        starBrighten.style.opacity = '0';
        const style = document.getElementById('star-brighten-style');
        if (style) {
          style.remove();
        }
      };

      document.body.addEventListener('mousemove', handleMouseMove);
      document.body.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.body.removeEventListener('mousemove', handleMouseMove);
        document.body.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchAsteroids = async () => {
    try {
      let foundData = false;
      let daysBack = 0;
      const maxDaysToTry = 7;

      // Try dates going backwards until we find data
      while (!foundData && daysBack < maxDaysToTry) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysBack);
        const dateStr = targetDate.toISOString().split('T')[0];

        const response = await api.get(`/api/asteroids/feed?start_date=${dateStr}&end_date=${dateStr}`);

        if (response.success && response.asteroids && response.asteroids.length > 0) {
          setAsteroids(response.asteroids);
          foundData = true;
          console.log(`Found ${response.asteroids.length} asteroids for ${dateStr}`);
        } else {
          daysBack++;
        }
      }

      // Fallback: If no data in single days, try a 7-day range
      if (!foundData) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const startDateStr = startDate.toISOString().split('T')[0];

        const response = await api.get(`/api/asteroids/feed?start_date=${startDateStr}&end_date=${endDate}`);
        if (response.success && response.asteroids) {
          setAsteroids(response.asteroids);
          console.log(`Found ${response.asteroids.length} asteroids in 7-day range`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch asteroids:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    neos: asteroids.length,
    hazardous: asteroids.filter(a => a.isHazardous).length,
    closest: Math.min(...asteroids.map(a => {
      const km = parseFloat(a.closeApproaches?.[0]?.missDistanceKm || Infinity);
      return km;
    })),
    fastest: Math.max(...asteroids.map(a => {
      const kmh = parseFloat(a.closeApproaches?.[0]?.velocityKmh || 0);
      return kmh;
    }), 0)
  };

  // Select asteroid of the day (highest risk score)
  const asteroidOfDay = asteroids.length > 0
    ? asteroids.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0]
    : null;

  const formatStat = (value, type) => {
    if (type === 'closest') {
      return `${(value / 1000000).toFixed(1)}M km`;
    } else if (type === 'fastest') {
      return `${value.toLocaleString()} km/h`;
    }
    return value.toFixed(0);
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleAsteroidClick = () => {
    if (asteroidOfDay) {
      navigate(`/asteroid/${asteroidOfDay.id}`);
    }
  };

  return (
    <main className="homepage-main">
      {/* Hero Section */}
      <section className="hero">
        <GlobeViewer />

        <div className="copy-panel">
          <p className="eyebrow">Live asteroid intelligence</p>
          <h1>Track what's coming. Before it gets close.</h1>
          <p className="subtitle">
            Orbitra keeps a pulse on every near-earth object so you can brief teams,
            plan responses, and stay ahead of the flyby.
          </p>
          <div className="hero-actions">
            <button
              className="btn primary"
              onClick={() => navigate('/explore')}
            >
              Explore
            </button>
            <button
              className="btn secondary"
              onClick={handleSignIn}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-row" aria-label="Live asteroid stats">
        <div className="stat-tile">
          <span>NEOs Today</span>
          <span className="stat-value">
            {loading ? '...' : formatStat(stats.neos, 'count')}
          </span>
        </div>
        <div className="stat-tile">
          <span>Hazardous</span>
          <span className="stat-value">
            {loading ? '...' : formatStat(stats.hazardous, 'count')}
          </span>
        </div>
        <div className="stat-tile">
          <span>Closest Flyby</span>
          <span className="stat-value">
            {loading ? '...' : stats.closest === Infinity ? 'N/A' : formatStat(stats.closest, 'closest')}
          </span>
        </div>
        <div className="stat-tile">
          <span>Fastest Object</span>
          <span className="stat-value">
            {loading ? '...' : formatStat(stats.fastest, 'fastest')}
          </span>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="feature-grid" id="features">
        <article className="feature-card">
          <h3>Real-Time Tracking</h3>
          <p>NASA NeoWs feeds refreshed every 6 hours with anomaly detection.</p>
        </article>
        <article className="feature-card">
          <h3>Risk Analysis</h3>
          <p>Orbitra ranks impact probability with custom momentum scoring.</p>
        </article>
        <article className="feature-card">
          <h3>3D Visualization</h3>
          <p>Dive through orbital paths with cinematic 3D interactions.</p>
        </article>
        <article className="feature-card">
          <h3>Community Alerts</h3>
          <p>Share watchlists, trigger alerts, and brief your teams instantly.</p>
        </article>
      </section>

      {/* Asteroid of the Day */}
      <section
        className="asteroid-card"
        onClick={handleAsteroidClick}
        style={{ cursor: asteroidOfDay ? 'pointer' : 'default' }}
        aria-labelledby="asteroid-title"
      >
        {loading ? (
          <div style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
            <p className="eyebrow">Loading asteroid data...</p>
          </div>
        ) : asteroidOfDay ? (
          <>
            <div>
              <p className="eyebrow">Asteroid of the day</p>
              <h2 id="asteroid-title">
                {asteroidOfDay.name.replace(/[()]/g, '')}
              </h2>
              <p className="asteroid-meta">
                Size: {(asteroidOfDay.diameterMaxM || 0).toFixed(0)} m ·
                Risk Score: {asteroidOfDay.riskScore || 0} / 100
              </p>
              <p className="asteroid-meta">
                Miss Distance: {formatStat(parseFloat(asteroidOfDay.closeApproaches?.[0]?.missDistanceKm || 0), 'closest')} ·
                Approach: {formatApproachDate(asteroidOfDay.closeApproaches?.[0]?.date || '')}
              </p>
            </div>
            <div className="asteroid-tag">Trending</div>
          </>
        ) : (
          <div style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
            <p className="eyebrow">Asteroid of the day</p>
            <p className="asteroid-meta">No asteroids detected today. Check back tomorrow!</p>
          </div>
        )}
      </section>

      {/* How Orbitra Works */}
      <section className="how-it-works" aria-labelledby="how-title">
        <h2 id="how-title">How Orbitra Works</h2>
        <div className="steps">
          <article className="step">
            <p className="step-number">01</p>
            <h3>Fetch Live Data</h3>
            <p>We tap directly into NASA's NeoWs API for up-to-the-minute NEO telemetry.</p>
          </article>
          <article className="step">
            <p className="step-number">02</p>
            <h3>Score the Risk</h3>
            <p>Velocity, magnitude, and miss distance combine into a transparent index.</p>
          </article>
          <article className="step">
            <p className="step-number">03</p>
            <h3>Alert & Explore</h3>
            <p>You track, collaborate, and subscribe to situation-based alerts.</p>
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <p>Powered by NASA NeoWs API</p>
        <a href="https://github.com/Jyoti-Ranjan-Das845/orbitra" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <p>Built for Hackathon 2025</p>
      </footer>
    </main>
  );
}
