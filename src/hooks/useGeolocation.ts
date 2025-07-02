import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackLocation?: boolean;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    trackLocation = false
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        loading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const successCallback = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false
      });
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown error occurred';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location services.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    };

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      geoOptions
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchId !== null) return;

    const successCallback = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false
      });
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown error occurred';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location services.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    };

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      geoOptions
    );

    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, watchId]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Auto-start location tracking if enabled
  useEffect(() => {
    if (trackLocation) {
      startWatching();
    }

    return () => {
      stopWatching();
    };
  }, [trackLocation, startWatching, stopWatching]);

  return {
    ...state,
    getCurrentLocation,
    startWatching,
    stopWatching,
    isWatching: watchId !== null
  };
};