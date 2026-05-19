import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchImageAnalysisDetail, fetchImageGallery } from "../services/imageGalleryService.js";

export function useImageGallery(filters = {}) {
  const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(Number(stableFilters.limit) || 20);
  const [offset, setOffset] = useState(Number(stableFilters.offset) || 0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const refreshGallery = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetchImageGallery(stableFilters);
      setItems(response.items || []);
      setTotalCount(response.total_count || 0);
      setLimit(response.limit || Number(stableFilters.limit) || 20);
      setOffset(response.offset || Number(stableFilters.offset) || 0);
      setLastUpdatedAt(new Date().toISOString());
      return true;
    } catch (loadError) {
      if (showLoading) {
        setError(loadError.message || "Unable to load image gallery.");
      }
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [stableFilters]);

  useEffect(() => {
    refreshGallery();
  }, [refreshGallery]);

  return {
    items,
    totalCount,
    limit,
    offset,
    isLoading,
    error,
    lastUpdatedAt,
    refreshGallery,
  };
}

export function useImageAnalysisDetails(readingId) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshAnalysis = useCallback(async ({ showLoading = true } = {}) => {
    if (!readingId) {
      return false;
    }

    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await fetchImageAnalysisDetail(readingId);
      setAnalysis(response);
      return true;
    } catch (loadError) {
      if (showLoading) {
        setError(loadError.message || "Unable to load image analysis.");
      }
      return false;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [readingId]);

  useEffect(() => {
    refreshAnalysis();
  }, [refreshAnalysis]);

  return {
    analysis,
    isLoading,
    error,
    refreshAnalysis,
  };
}

