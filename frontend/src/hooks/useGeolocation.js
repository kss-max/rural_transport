import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for GPS location with accuracy tracking
 * Designed for rural areas with potentially poor GPS signal.
 *
 * Fallback strategy: when enableHighAccuracy is true and the request
 * times out (common on desktops without a GPS chip), the hook
 * automatically retries with enableHighAccuracy=false so WiFi / IP
 * based positioning can still return a result.
 */
function useGeolocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 20000,        // 20 s (was 15 s) – more forgiving on desktops
    maximumAge = 30000,     // 30 s (was 5 s) – allow cached positions
    watchPosition = false,
    onUpdate = null,
    onError = null
  } = options;

  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(null);

  const watchIdRef = useRef(null);

  // Process position update
  const handlePosition = useCallback((position) => {
    const { latitude, longitude, accuracy: acc, heading: hdg, speed: spd } = position.coords;

    const locationData = {
      latitude,
      longitude,
      accuracy: acc,
      heading: hdg,
      speed: spd,
      timestamp: position.timestamp
    };

    setLocation({ latitude, longitude });
    setAccuracy(acc);
    setHeading(hdg);
    setSpeed(spd);
    setTimestamp(position.timestamp);
    setError(null);
    setLoading(false);

    if (onUpdate) {
      onUpdate(locationData);
    }
  }, [onUpdate]);

  // Build a user-friendly error message from a GeolocationPositionError
  const errorMessageFromCode = useCallback((err) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Location permission denied. Please enable GPS.';
      case err.POSITION_UNAVAILABLE:
        return 'Location unavailable. GPS signal may be weak.';
      case err.TIMEOUT:
        return 'Location request timed out. Try again.';
      default:
        return err.message || 'Unknown location error';
    }
  }, []);

  // Handle error (final – no more retries)
  const handleError = useCallback((err) => {
    const errorMessage = errorMessageFromCode(err);

    setError(errorMessage);
    setLoading(false);

    if (onError) {
      onError(errorMessage, err);
    }
  }, [onError, errorMessageFromCode]);

  // -------------------------------------------------------
  // Get current position with automatic fallback.
  // 1st attempt: uses the caller's options (high accuracy).
  // If that times out → 2nd attempt: enableHighAccuracy=false
  //   with a generous timeout so WiFi/IP positioning can work.
  // -------------------------------------------------------
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      (firstErr) => {
        // If it timed out AND we were using high accuracy, retry with low accuracy
        if (firstErr.code === firstErr.TIMEOUT && enableHighAccuracy) {
          console.log('[useGeolocation] High-accuracy timed out, retrying with low accuracy…');
          navigator.geolocation.getCurrentPosition(
            handlePosition,
            handleError,   // give up on second failure
            {
              enableHighAccuracy: false,
              timeout: 30000,    // 30 s – generous for IP/WiFi lookup
              maximumAge: 60000  // accept a 1-minute-old cached fix
            }
          );
        } else {
          handleError(firstErr);
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handlePosition, handleError]);

  // -------------------------------------------------------
  // Watch position – also has a fallback: if the first attempt
  // errors with TIMEOUT, we restart the watcher with low accuracy.
  // -------------------------------------------------------
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (watchIdRef.current !== null) {
      return; // Already watching
    }

    setLoading(true);
    setError(null);

    let hasReceivedPosition = false;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        hasReceivedPosition = true;
        handlePosition(position);
      },
      (err) => {
        // Fallback: if TIMEOUT on the very first attempt with high accuracy,
        // restart the watcher with low accuracy instead of giving up.
        if (err.code === err.TIMEOUT && enableHighAccuracy && !hasReceivedPosition) {
          console.log('[useGeolocation] Watch high-accuracy timed out, falling back to low accuracy…');
          // Clear the current watcher
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              hasReceivedPosition = true;
              handlePosition(position);
            },
            handleError,
            {
              enableHighAccuracy: false,
              timeout: 30000,
              maximumAge: 60000
            }
          );
        } else {
          handleError(err);
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handlePosition, handleError]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLoading(false);
  }, []);

  // Auto-start watching if option is set
  useEffect(() => {
    if (watchPosition) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [watchPosition, startWatching, stopWatching]);

  // Get accuracy level description
  const getAccuracyLevel = () => {
    if (accuracy === null) return 'unknown';
    if (accuracy <= 10) return 'excellent';
    if (accuracy <= 30) return 'good';
    if (accuracy <= 100) return 'fair';
    return 'poor';
  };

  // Format accuracy for display
  const formatAccuracy = () => {
    if (accuracy === null) return 'N/A';
    if (accuracy < 1000) return `±${Math.round(accuracy)}m`;
    return `±${(accuracy / 1000).toFixed(1)}km`;
  };

  return {
    // Location data
    location,
    latitude: location?.latitude,
    longitude: location?.longitude,
    accuracy,
    heading,
    speed,
    timestamp,

    // Status
    loading,
    error,
    isWatching: watchIdRef.current !== null,

    // Helpers
    accuracyLevel: getAccuracyLevel(),
    formattedAccuracy: formatAccuracy(),

    // Actions
    getCurrentPosition,
    startWatching,
    stopWatching,
    refresh: getCurrentPosition
  };
}

export default useGeolocation;
