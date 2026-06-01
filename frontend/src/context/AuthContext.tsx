"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, register as registerApi } from "@/services/authApi";
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  isAuthenticated,
} from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const savedUser = getUser();
      setUserState(savedUser);
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const result = await loginApi({ email, password });
    setToken(result.token);
    setUser(result.user);
    setUserState(result.user);
    router.push("/");
  }

  async function register(name: string, email: string, password: string) {
    const result = await registerApi({ name, email, password });
    setToken(result.token);
    setUser(result.user);
    setUserState(result.user);
    router.push("/");
  }

  function logout() {
    removeToken();
    setUserState(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
