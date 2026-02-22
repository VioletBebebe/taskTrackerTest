// authThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { setCredentials, logout as logoutAction } from "./authSlice";

// ===============================
// LOGIN
// ===============================
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { dispatch }
  ) => {
    const res = await fetch("http://localhost:3003/auth/login", {
      method: "POST",
      credentials: "include", // отправляем HttpOnly cookie
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json(); // { accessToken, user }
    dispatch(setCredentials(data));

    return data;
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ email, password, name }: {email: string, password: string, name: string}, { dispatch }) => {
    const res = await fetch("http://localhost:3003/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) throw new Error("Registration failed");

    const data = await res.json();
    dispatch(setCredentials(data));
    return data;
  }
);
// ===============================
// LOGOUT
// ===============================
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    const res = await fetch("http://localhost:3003/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Logout failed");

    dispatch(logoutAction());
    return true;
  }
);

// ===============================
// REFRESH TOKEN
// ===============================
export const refreshToken = createAsyncThunk(
  "auth/refresh",
  async (_, { dispatch }) => {
    const res = await fetch("http://localhost:3003/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Refresh failed");

    const data = await res.json(); // { accessToken, user }
    dispatch(setCredentials(data));

    return data;
  }
);

// ===============================
// DELETE USER
// ===============================
export const deleteUser = createAsyncThunk(
  "auth/deleteUser",
  async (_, { dispatch }) => {
    const res = await fetch("http://localhost:3003/user", {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Delete user failed");

    dispatch(logoutAction());
    return true;
  }
);

// ===============================
// UPDATE USER DATA
// ===============================
export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (
    { name, email }: { name?: string; email?: string },
    { dispatch, getState }
  ) => {
    const state: any = getState();
    const token = state.auth.accessToken;

    const res = await fetch("http://localhost:3003/user", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ name, email }),
    });

    if (!res.ok) throw new Error("Update user failed");

    const data = await res.json(); // { user }
    dispatch(setCredentials({ ...state.auth, user: data.user }));

    return data.user;
  }
);

// ===============================
// UNIVERSAL FETCH WITH AUTO-REFRESH
// (если хочешь использовать в других thunks)
// ===============================
export const authorizedFetch = async (
  url: string,
  options: RequestInit,
  thunkAPI: any
) => {
  const state = thunkAPI.getState();
  const token = state.auth.accessToken;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  // Если токен протух → пробуем refresh
  if (res.status === 401) {
    const refreshRes = await thunkAPI.dispatch(refreshToken());

    if (refreshRes.meta.requestStatus === "fulfilled") {
      const newToken = thunkAPI.getState().auth.accessToken;

      return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          ...(options.headers || {}),
          Authorization: newToken ? `Bearer ${newToken}` : "",
        },
      });
    }

    thunkAPI.dispatch(logoutAction());
    throw new Error("Unauthorized");
  }

  return res;
};
