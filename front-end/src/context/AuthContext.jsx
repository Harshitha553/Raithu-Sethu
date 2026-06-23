import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { authApi } from "../api/auth";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("rs_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("rs_token"));

  const persist = useCallback((nextToken, nextUser) => {
    localStorage.setItem("rs_token", nextToken);
    localStorage.setItem("rs_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (role, credentials) => {
      const res =
        role === "farmer"
          ? await authApi.farmerLogin(credentials)
          : await authApi.buyerLogin(credentials);
      const { token: nextToken, user: rawUser } = res.data;
      const nextUser = { ...rawUser, role };
      persist(nextToken, nextUser);
      return nextUser;
    },
    [persist]
  );

  const register = useCallback(
    async (role, payload) => {
      const res =
        role === "farmer"
          ? await authApi.farmerRegister(payload)
          : await authApi.buyerRegister(payload);
      const { token: nextToken, user_id } = res.data;
      const nextUser = { id: user_id, name: payload.name, email: payload.email, role };
      persist(nextToken, nextUser);
      return nextUser;
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("rs_token");
    localStorage.removeItem("rs_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      role: user?.role ?? null,
      login,
      register,
      logout,
    }),
    [user, token, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
