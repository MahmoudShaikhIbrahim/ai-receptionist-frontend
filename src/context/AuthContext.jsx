// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { loginBusiness, signupBusiness, getBusinessMe } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("pureai_token"));
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true); // while checking token

  useEffect(() => {
    async function init() {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        const data = await getBusinessMe();
        setBusiness(data.business);
      } catch (err) {
        console.error("Failed to load business from token:", err);
        setToken(null);
        localStorage.removeItem("pureai_token");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [token]);

  async function handleSignup({ businessName, email, password, businessType }) {
    const data = await signupBusiness({ businessName, email, password, businessType });
    const newToken = data.token;

    localStorage.setItem("pureai_token", newToken);
    setToken(newToken);
    setBusiness(data.business);

    return data;
  }

  async function handleLogin({ email, password }) {
    const data = await loginBusiness({ email, password });
    const newToken = data.token;

    localStorage.setItem("pureai_token", newToken);
    setToken(newToken);
    setBusiness(data.business);

    return data;
  }

  function handleLogout() {
    localStorage.removeItem("pureai_token");
    setToken(null);
    setBusiness(null);
  }

  const value = {
    token,
    business,
    loading,
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout,
    setBusiness,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}