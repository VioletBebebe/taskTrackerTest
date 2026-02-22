// authSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import {
  loginUser,
  logoutUser,
  refreshToken,
  deleteUser,
  updateUser,
} from "./authThunk";

interface AuthState {
  accessToken: string | null;
  user: any | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  initialized: boolean; // важно для автологина
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: "idle",
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.error = null;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.error = null;
    },
    markInitialized: (state) => {
      state.initialized = true;
    },
  },

  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Login failed";
      });

    // LOGOUT
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.accessToken = null;
        state.user = null;
        state.status = "idle";
      });

    // REFRESH TOKEN
    builder
      .addCase(refreshToken.pending, (state) => {
        state.status = "loading";
      })
      .addCase(refreshToken.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(refreshToken.rejected, (state) => {
        state.status = "failed";
        state.accessToken = null;
        state.user = null;
      });

    // UPDATE USER
    builder
      .addCase(updateUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Update failed";
      });

    // DELETE USER
    builder
      .addCase(deleteUser.fulfilled, (state) => {
        state.accessToken = null;
        state.user = null;
        state.status = "idle";
      });
  },
});

export const { setCredentials, logout, markInitialized } = authSlice.actions;
export default authSlice.reducer;