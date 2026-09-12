import { useEffect, useState, useCallback, useRef } from 'react';
import { collaborationService } from '../service';
import { migrateTripToV2 } from '../../shared/utils/migrationAdapter';

export interface UseTripSyncOptions {
  tripId: string;
  onTripLoaded?: (trip: any) => void;
  onError?: (err: any) => void;
}

export function useTripSync({ tripId, onTripLoaded, onError }: UseTripSyncOptions) {
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSyncError(null);

    const unsubscribe = collaborationService.subscribeToTrip(
      tripId,
      (updatedTrip) => {
        if (updatedTrip) {
          const v2Trip = migrateTripToV2(updatedTrip);
          setTripData(v2Trip);
          onTripLoaded?.(v2Trip);
        }
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [tripId]);

  return {
    tripData,
    isLoading,
    syncError,
    setTripData,
  };
}
