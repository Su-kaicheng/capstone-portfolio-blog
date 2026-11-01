import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  login as loginRequest,
  me as meRequest,
  register as registerRequest,
} from "../lib/api.js";

const TOKEN_KEY = "portfolio_token";
const USER_KEY = "portfolio_user";

/** Context consumed through the `useAuth()` hook. */
export const AuthContext = createContext(null);

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable — in-memory state is still cleared */
  }
}

/**
 * Owns authentication: restores the session from localStorage, verifies the
 * stored JWT against GET /api/users/me on startup, and exposes login,
 * register, logout, user, token, isAuthenticated and the bootstrap `loading`.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(readStoredToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const storedToken = readStoredToken();

    if (!storedToken) {
      try {
        localStorage.removeItem(USER_KEY);
      } catch {
        /* ignore */
      }
      setUser(null);
      setToken(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    meRequest(storedToken)
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        setToken(storedToken);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        if (!active) return;
        clearStoredSession();
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const persistSession = useCallback((nextToken, nextUser) => {
    try {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    } catch {
      /* storage unavailable — keep the session in memory */
    }
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const data = await loginRequest(credentials);
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession],
  );

  const register = useCallback(
    async (details) => {
      const data = await registerRequest(details);
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
