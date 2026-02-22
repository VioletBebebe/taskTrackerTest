import { createBrowserRouter } from "react-router"
import LoginPage from "../pages/loginPage"
import { ProtectedRoute } from "../pages/protectedRoute"
import { BoardsDashboard } from "../pages/createBoardPage"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/boards",
    element: (
      <ProtectedRoute>
        <BoardsDashboard />
      </ProtectedRoute>
    )
  },
  {
    path: "/boards/:boardId",
    element: (
      <ProtectedRoute>
        <BoardsDashboard />
      </ProtectedRoute>
    )
  }
])