import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Protected({ children }) {
  const nav = useNavigate();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then(() => setOk(true)).catch(() => nav("/login"));
  }, [nav]);

  return ok ? children : null;
}
