import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAppSelector(state => state.auth.user);
  const initialized = useAppSelector(state => state.auth.initialized);

  // Пока initAuth не завершился — ничего не делаем
  if (!initialized) return null;

  // Если initAuth завершился и user нет — редирект
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
