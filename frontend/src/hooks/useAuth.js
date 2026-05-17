import { useCallback, useEffect, useState } from "react";

import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "../services/authService.js";
import { clearToken, getToken, setToken } from "../utils/tokenStorage.js";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedUser() {
      const savedToken = getToken();
      if (!savedToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
          setTokenState(savedToken);
        }
      } catch {
        clearToken();
        if (isMounted) {
          setCurrentUser(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    loadSavedUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const response = await loginRequest(email, password);
      setToken(response.access_token);
      setTokenState(response.access_token);
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setAuthError(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setCurrentUser(null);
    setTokenState(null);
    setAuthError(null);
  }, []);

  return {
    currentUser,
    token,
    loading: isInitializing || isSubmitting,
    isInitializing,
    isSubmitting,
    authError,
    login,
    logout,
    isAuthenticated: Boolean(currentUser && token),
  };
}
