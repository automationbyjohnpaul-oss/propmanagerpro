"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { login as loginApi, register as registerApi } from "@/services/authApi";
import { setToken, removeToken, setUser, getUser } from "@/lib/auth";

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
  const router = useRouter();

  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = getUser();

    if (savedUser) {
      setUserState(savedUser);
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginApi({ email, password });

    setToken(result.token);
    setUser(result.user);
    setUserState(result.user);

    router.replace("/", { scroll: false });
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await registerApi({ name, email, password });

    setToken(result.token);
    setUser(result.user);
    setUserState(result.user);

    router.replace("/", { scroll: false });
  };

  const logout = () => {
    removeToken();
    setUserState(null);

    router.replace("/login");
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
