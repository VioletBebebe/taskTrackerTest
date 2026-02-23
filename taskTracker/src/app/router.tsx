import { createBrowserRouter } from "react-router"
import LoginPage from "../pages/loginPage"
import { ProtectedRoute } from "../pages/protectedRoute"
import { CreateBoardsPage } from "../pages/createBoardPage"
import { BoardPage } from "../pages/board/board"
export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <CreateBoardsPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/:boardId",
    element: (
      <ProtectedRoute>
        <BoardPage />
      </ProtectedRoute>
    )
  }
])