import { useState, useEffect } from 'react';

function OfflineIndicator({ isOnline, cachedTiles = 0, lastUpdate = null, pendingSyncs = 0 }) {
  const [show, setShow] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setJustCameOnline(false);
    } else if (show && !justCameOnline) {
      // Just came back online
      setJustCameOnline(true);
      // Hide after 3 seconds when back online
      const timer = setTimeout(() => {
        setShow(false);
        setJustCameOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Don't show if online and not recently reconnected
  if (isOnline && !justCameOnline && !show) {
    return null;
  }

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    const diff = Math.floor((Date.now() - lastUpdate) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : ''}`}>
      {isOnline ? (
        <>
          <span>✅</span>
          <span>Back online</span>
          {pendingSyncs > 0 && (
            <span className="text-xs">Syncing {pendingSyncs} updates...</span>
          )}
        </>
      ) : (
        <>
          <span>📴</span>
          <div className="flex flex-col">
            <span className="font-medium">You're offline</span>
            <div className="text-xs flex gap-3">
              {cachedTiles > 0 && <span>Cached: ✅</span>}
              {lastUpdate && <span>Last update: {formatLastUpdate()}</span>}
              {pendingSyncs > 0 && <span>Pending: {pendingSyncs}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;
