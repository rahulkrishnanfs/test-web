import { createContext, useCallback, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("cn_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("cn_token");
      localStorage.removeItem("cn_role");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const loginAdmin = async (email, password) => {
    const { data } = await client.post("/auth/admin/login", { email, password });
    localStorage.setItem("cn_token", data.access_token);
    localStorage.setItem("cn_role", data.role);
    setUser({ role: data.role, email: data.email });
    return data;
  };

  const loginAttendee = async (email) => {
    const { data } = await client.post("/auth/attendee/login", { email });
    localStorage.setItem("cn_token", data.access_token);
    localStorage.setItem("cn_role", data.role);
    setUser({ role: data.role, email: data.email, name: data.name });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("cn_token");
    localStorage.removeItem("cn_role");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginAdmin, loginAttendee, logout, reload: loadMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
