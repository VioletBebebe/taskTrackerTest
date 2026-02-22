// Root.tsx
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { initAuth } from "./auth/initAuth";
import { router } from "./app/router";
import { useAppDispatch, useAppSelector } from "./app//hooks";



export default function Root() {
  const dispatch = useAppDispatch();

  const initialized = useAppSelector(state => state.auth.initialized);


  useEffect(() => {
    dispatch(initAuth());
  }, []);

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return <RouterProvider router={router} />;
}