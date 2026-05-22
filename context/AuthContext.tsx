"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("mm_token");
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMe(t: string) {
    try {
      const res = await axios.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("mm_token");
      setToken(null);
      setUser(null);
    }
  }

  async function login(email: string, password: string) {
    const res = await axios.post("/api/auth/login", { email, password });
    const { user, token } = res.data;
    setUser(user);
    setToken(token);
    localStorage.setItem("mm_token", token);
  }

  async function register(name: string, email: string, password: string) {
    const res = await axios.post("/api/auth/register", { name, email, password });
    const { user, token } = res.data;
    setUser(user);
    setToken(token);
    localStorage.setItem("mm_token", token);
  }

  async function logout() {
    await axios.post("/api/auth/logout").catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem("mm_token");
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
