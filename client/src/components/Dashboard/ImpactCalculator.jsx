import { useState } from 'react';

export default function ImpactCalculator() {
  const [diameter, setDiameter] = useState(925); // meters
  const [velocity, setVelocity] = useState(29.1); // km/s

  const calculateImpact = () => {
    const density = 3000; // kg/m³ (typical asteroid density)

    // Mass calculation (sphere)
    const radiusM = diameter / 2;
    const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
    const massKg = volumeM3 * density;

    // Kinetic energy: 0.5 * m * v²
    const velocityMS = velocity * 1000;
    const energyJoules = 0.5 * massKg * Math.pow(velocityMS, 2);

    // Convert to megatons TNT (1 MT = 4.184e15 joules)
    const energyMT = energyJoules / 4.184e15;

    // Hiroshima bombs (1 bomb ≈ 0.015 MT)
    const hiroshimas = energyMT / 0.015;

    // Crater diameter (empirical: ~20× asteroid diameter for typical impacts)
    const craterDiameterM = diameter * 20;
    const craterDiameterKm = craterDiameterM / 1000;

    return {
      energyMT,
      hiroshimas,
      craterDiameterKm,
      massKg,
    };
  };

  const getImpactScale = (energyMT) => {
    if (energyMT < 0.01) {
      return {
        label: 'Fireball',
        description: 'Burns up in atmosphere',
        color: 'text-success-green',
        bgColor: 'bg-success-green',
        percentage: 5,
      };
    }
    if (energyMT < 1) {
      return {
        label: 'Local Damage',
        description: 'Chelyabinsk-class event',
        color: 'text-star-blue',
        bgColor: 'bg-star-blue',
        percentage: 15,
      };
    }
    if (energyMT < 100) {
      return {
        label: 'City Destroyer',
        description: 'Tunguska-class event',
        color: 'text-warning-orange',
        bgColor: 'bg-warning-orange',
        percentage: 35,
      };
    }
    if (energyMT < 10000) {
      return {
        label: 'Regional Catastrophe',
        description: 'Multi-state devastation',
        color: 'text-danger-red',
        bgColor: 'bg-danger-red',
        percentage: 65,
      };
    }
    if (energyMT < 1000000) {
      return {
        label: 'Continental Devastation',
        description: 'Climate effects for years',
        color: 'text-nebula-purple',
        bgColor: 'bg-nebula-purple',
        percentage: 85,
      };
    }
    return {
      label: 'EXTINCTION LEVEL EVENT',
      description: 'Global mass extinction',
      color: 'text-danger-red',
      bgColor: 'bg-danger-red',
      percentage: 100,
    };
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(1);
  };

  const results = calculateImpact();
  const scale = getImpactScale(results.energyMT);

  return (
    <div className="bg-cosmic-black/50 border border-nebula-purple/30 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-white mb-2">☄️ What If It Hit?</h3>
      <p className="text-sm text-gray-400 mb-6">
        Calculate the impact of an asteroid strike on Earth
      </p>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Asteroid Diameter (meters)</label>
          <input
            type="range"
            min="10"
            max="5000"
            step="10"
            value={diameter}
            onChange={(e) => setDiameter(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">10m</span>
            <span className="text-xl font-bold text-white">{diameter}m</span>
            <span className="text-xs text-gray-500">5km</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Impact Velocity (km/s)</label>
          <input
            type="range"
            min="11"
            max="72"
            step="0.1"
            value={velocity}
            onChange={(e) => setVelocity(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">11 km/s</span>
            <span className="text-xl font-bold text-white">{velocity} km/s</span>
            <span className="text-xs text-gray-500">72 km/s</span>
          </div>
        </div>
      </div>

      {/* Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-cosmic-black border border-star-blue/30 rounded-lg p-4">
          <div className="text-4xl mb-2">💥</div>
          <div className="text-sm text-gray-400 mb-1">Impact Energy</div>
          <div className="text-2xl font-bold text-star-blue">
            {formatNumber(results.energyMT)} MT
          </div>
          <div className="text-xs text-gray-500 mt-1">of TNT equivalent</div>
        </div>

        <div className="bg-cosmic-black border border-danger-red/30 rounded-lg p-4">
          <div className="text-4xl mb-2">💣</div>
          <div className="text-sm text-gray-400 mb-1">Atomic Power</div>
          <div className="text-2xl font-bold text-danger-red">
            {formatNumber(results.hiroshimas)}×
          </div>
          <div className="text-xs text-gray-500 mt-1">Hiroshima bombs</div>
        </div>

        <div className="bg-cosmic-black border border-success-green/30 rounded-lg p-4">
          <div className="text-4xl mb-2">🕳️</div>
          <div className="text-sm text-gray-400 mb-1">Crater Size</div>
          <div className="text-2xl font-bold text-success-green">
            {results.craterDiameterKm.toFixed(1)} km
          </div>
          <div className="text-xs text-gray-500 mt-1">diameter</div>
        </div>
      </div>

      {/* Impact Scale Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-300">IMPACT SEVERITY</span>
          <span className={`text-sm font-bold ${scale.color}`}>{scale.label}</span>
        </div>
        <div className="h-4 bg-cosmic-black rounded-full overflow-hidden relative">
          <div
            className={`h-full ${scale.bgColor} transition-all duration-500`}
            style={{ width: `${scale.percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{scale.description}</p>
      </div>

      {/* Reference Comparisons */}
      <div className="bg-cosmic-black border border-nebula-purple/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">FOR REFERENCE</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Chicxulub (dinosaur killer):</span>
            <span className="text-white font-semibold">~100,000,000 MT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tunguska 1908:</span>
            <span className="text-white font-semibold">~15 MT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Chelyabinsk 2013:</span>
            <span className="text-white font-semibold">~0.5 MT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
