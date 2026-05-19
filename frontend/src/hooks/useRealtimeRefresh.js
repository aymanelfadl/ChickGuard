import { useCallback, useEffect, useRef, useState } from "react";

export function useRealtimeRefresh(realtime, refreshData) {
  const [liveUpdateReceived, setLiveUpdateReceived] = useState(false);
  const [lastRefreshEventType, setLastRefreshEventType] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const indicatorTimerRef = useRef(null);

  const showLiveUpdateIndicator = useCallback(() => {
    setLiveUpdateReceived(true);
    window.clearTimeout(indicatorTimerRef.current);
    indicatorTimerRef.current = window.setTimeout(() => {
      setLiveUpdateReceived(false);
    }, 3000);
  }, []);

  const refreshManually = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData({ showLoading: false });
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  useEffect(() => {
    const eventId = realtime?.lastEvent?.id;
    if (!eventId) {
      return undefined;
    }

    let isCurrent = true;

    async function refreshFromRealtime() {
      setIsRefreshing(true);
      const didRefresh = await refreshData({ showLoading: false });
      if (isCurrent && didRefresh) {
        setLastRefreshEventType(realtime.lastEvent.type);
        showLiveUpdateIndicator();
      }
      if (isCurrent) {
        setIsRefreshing(false);
      }
    }

    refreshFromRealtime();

    return () => {
      isCurrent = false;
    };
  }, [refreshData, realtime?.lastEvent?.id, showLiveUpdateIndicator]);

  useEffect(() => {
    return () => {
      window.clearTimeout(indicatorTimerRef.current);
    };
  }, []);

  return {
    isRefreshing,
    lastRefreshEventType,
    liveUpdateReceived,
    refreshManually,
  };
}
