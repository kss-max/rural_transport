import { useState } from 'react';

function LayerSwitcher({ activeLayer, onLayerChange, layers }) {
  const [isOpen, setIsOpen] = useState(false);

  const layerList = Object.values(layers);
  const currentLayer = layers[activeLayer];

  return (
    <div className="layer-switcher">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="layer-switcher-toggle"
        title="Change map style"
      >
        <span>{currentLayer?.icon || '🗺️'}</span>
        <span className="text-sm">{currentLayer?.name || 'Map'}</span>
        <span className="text-xs text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="layer-switcher-dropdown">
          {layerList.map((layer) => (
            <button
              key={layer.id}
              onClick={() => {
                onLayerChange(layer.id);
                setIsOpen(false);
              }}
              className={`layer-switcher-btn ${activeLayer === layer.id ? 'active' : ''}`}
            >
              <span className="text-lg">{layer.icon}</span>
              <div className="flex flex-col">
                <span className="font-medium">{layer.name}</span>
                <span className="text-xs opacity-70">{layer.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LayerSwitcher;
