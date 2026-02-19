import { createBrowserRouter } from "react-router"
import { BoardPage } from "../pages/boardPage"
import { LoginPage } from "../pages/loginPage"

export const router = createBrowserRouter([
  {
    path: "/login", 
    element: <LoginPage /> 
  }, 
  {
    path: "/",
    element: <BoardPage />
  }
])