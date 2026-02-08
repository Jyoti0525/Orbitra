export default function SizeComparison({ diameterKm }) {
  const diameterM = diameterKm * 1000;

  const comparisons = [
    { name: 'Car', size: 4.5, icon: '🚗' },
    { name: 'Bus', size: 12, icon: '🚌' },
    { name: 'Football Field', size: 110, icon: '🏟' },
    { name: 'Statue of Liberty', size: 93, icon: '🗽' },
    { name: 'Eiffel Tower', size: 330, icon: '🗼' },
  ];

  const getBarWidth = (objSize) => {
    const ratio = diameterM / objSize;
    const percentage = Math.min((ratio / 200) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-star-blue mb-4">Size Comparison</h3>
      {comparisons.map((item) => {
        const ratio = diameterM / item.size;
        return (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-2xl w-8">{item.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{item.name}</span>
                <span className="text-white">{ratio >= 1 ? `${ratio.toFixed(0)}×` : `${(1/ratio).toFixed(1)}× smaller`}</span>
              </div>
              <div className="h-2 bg-cosmic-black rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-star-blue to-nebula-purple transition-all duration-500"
                  style={{ width: getBarWidth(item.size) }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
