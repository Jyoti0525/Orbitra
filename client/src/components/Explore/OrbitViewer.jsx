import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function Earth() {
  const earthRef = useRef();

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      <Sphere ref={earthRef} args={[0.5, 32, 32]} position={[0, 0, 0]}>
        <meshPhongMaterial
          color="#1e90ff"
          emissive="#0066cc"
          emissiveIntensity={0.2}
        />
      </Sphere>
      {/* Atmosphere glow */}
      <Sphere args={[0.55, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#4da6ff"
          transparent
          opacity={0.1}
        />
      </Sphere>
    </group>
  );
}

function AsteroidOrbit({ asteroid, isSelected, isHovered, onClick, onPointerOver, onPointerOut }) {
  const approach = asteroid.closeApproaches?.[0];
  if (!approach) return null;

  // Calculate orbit parameters (simplified ellipse based on miss distance)
  const distance = approach.missDistanceKm / 10000000; // Scale down for visibility
  const semiMajorAxis = distance * 1.2;
  const semiMinorAxis = distance * 0.8;

  // Create ellipse path
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,              // center
      semiMajorAxis, semiMinorAxis, // x radius, y radius
      0, 2 * Math.PI,   // start angle, end angle
      false,             // clockwise
      0                  // rotation
    );
    const pts = curve.getPoints(64);
    return pts.map(p => new THREE.Vector3(p.x, 0, p.y));
  }, [semiMajorAxis, semiMinorAxis]);

  // Asteroid position on orbit
  const asteroidPos = useMemo(() => {
    const angle = (asteroid.id.charCodeAt(0) % 360) * (Math.PI / 180);
    return new THREE.Vector3(
      semiMajorAxis * Math.cos(angle),
      0,
      semiMinorAxis * Math.sin(angle)
    );
  }, [asteroid.id, semiMajorAxis, semiMinorAxis]);

  // Color based on risk
  const getRiskColor = (score) => {
    if (score >= 70) return '#ef4444'; // danger-red
    if (score >= 40) return '#f97316'; // warning-orange
    return '#10b981'; // success-green
  };

  const color = getRiskColor(asteroid.riskScore);
  const lineOpacity = isSelected ? 1 : isHovered ? 0.7 : 0.3;
  const asteroidScale = isSelected ? 0.15 : isHovered ? 0.12 : 0.08;

  return (
    <group>
      {/* Orbit line */}
      <Line
        points={points}
        color={color}
        lineWidth={isSelected ? 3 : isHovered ? 2 : 1}
        transparent
        opacity={lineOpacity}
      />

      {/* Asteroid dot */}
      <Sphere
        args={[asteroidScale, 16, 16]}
        position={asteroidPos}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          onPointerOver();
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          onPointerOut();
        }}
      >
        <meshPhongMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected || isHovered ? 0.5 : 0.2}
        />
      </Sphere>

      {/* Pulse effect for selected/hovered */}
      {(isSelected || isHovered) && (
        <Sphere args={[asteroidScale * 1.5, 16, 16]} position={asteroidPos}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
          />
        </Sphere>
      )}

      {/* Dotted line to Earth when hovered */}
      {isHovered && (
        <Line
          points={[new THREE.Vector3(0, 0, 0), asteroidPos]}
          color={color}
          lineWidth={1}
          dashed
          dashScale={2}
          transparent
          opacity={0.5}
        />
      )}
    </group>
  );
}

function Scene({ asteroids, selectedAsteroid, hoveredAsteroid, onAsteroidClick, onAsteroidHover, onAsteroidLeave }) {
  const controlsRef = useRef();

  // Auto-zoom to selected asteroid
  useEffect(() => {
    if (selectedAsteroid && controlsRef.current) {
      const approach = selectedAsteroid.closeApproaches?.[0];
      if (approach) {
        const distance = approach.missDistanceKm / 10000000;
        const semiMajorAxis = distance * 1.2;

        // Smooth camera transition
        const currentPos = controlsRef.current.object.position;
        const targetPos = new THREE.Vector3(semiMajorAxis * 0.5, semiMajorAxis * 0.3, semiMajorAxis);

        currentPos.lerp(targetPos, 0.1);
      }
    }
  }, [selectedAsteroid]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <Earth />

      {asteroids.map((asteroid) => (
        <AsteroidOrbit
          key={asteroid.id}
          asteroid={asteroid}
          isSelected={selectedAsteroid?.id === asteroid.id}
          isHovered={hoveredAsteroid?.id === asteroid.id}
          onClick={() => onAsteroidClick(asteroid)}
          onPointerOver={() => onAsteroidHover(asteroid)}
          onPointerOut={onAsteroidLeave}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={2}
        maxDistance={50}
      />
    </>
  );
}

export default function OrbitViewer({
  asteroids,
  selectedAsteroid,
  hoveredAsteroid,
  onAsteroidClick,
  onAsteroidHover,
  onAsteroidLeave,
}) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0a1a] to-[#000000] relative">
      <Canvas camera={{ position: [15, 10, 15], fov: 50 }}>
        <Scene
          asteroids={asteroids}
          selectedAsteroid={selectedAsteroid}
          hoveredAsteroid={hoveredAsteroid}
          onAsteroidClick={onAsteroidClick}
          onAsteroidHover={onAsteroidHover}
          onAsteroidLeave={onAsteroidLeave}
        />
      </Canvas>

      {/* Legend overlay */}
      <div className="absolute top-4 left-4 bg-cosmic-black/70 border border-nebula-purple/30 rounded-lg p-4">
        <h3 className="text-sm font-bold text-white mb-2">Risk Levels</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-red"></div>
            <span className="text-gray-300">Critical (70+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning-orange"></div>
            <span className="text-gray-300">High (40-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success-green"></div>
            <span className="text-gray-300">Low (0-39)</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredAsteroid && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-cosmic-black/90 border border-star-blue rounded-lg p-3 min-w-[200px]">
            <div className="font-bold text-white mb-1">{hoveredAsteroid.name}</div>
            <div className="text-sm text-gray-400">
              Risk: <span className="text-star-blue">{hoveredAsteroid.riskScore}</span>
            </div>
            {hoveredAsteroid.closeApproaches?.[0] && (
              <div className="text-sm text-gray-400">
                Distance: <span className="text-star-blue">
                  {(hoveredAsteroid.closeApproaches[0].missDistanceKm / 1000000).toFixed(2)}M km
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
