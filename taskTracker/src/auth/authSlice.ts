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
  user: any | null;  // лучше заменить на User | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  initialized: boolean;
  userName?: string | null;   // ← остаётся опциональным
  userId?: string | null;     // ← если нужно
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: "idle",
  error: null,
  initialized: false,
  // НЕ пишем userName и userId — они undefined
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
    // LOGIN
    .addCase(loginUser.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(loginUser.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.accessToken = action.payload.accessToken;
      state.userName = action.payload.user?.name ?? null;
      state.userId = action.payload.user?.id ?? null;
      state.initialized = true;
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.error.message || "Login failed";
    })

    // REFRESH (самая частая причина ошибки)
    .addCase(refreshToken.pending, (state) => {
      state.status = "loading";
      state.error = null;
    })
    .addCase(refreshToken.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.accessToken = action.payload.accessToken;
      state.userName = action.payload.user?.name ?? null;
      state.userId = action.payload.user?.id ?? null;
      state.initialized = true;
    })
    .addCase(refreshToken.rejected, (state, action) => {
      state.status = "failed";
      state.error = action.error.message || "Refresh failed";
    })

    // LOGOUT
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.accessToken = null;
        state.user = null;
        state.status = "idle";
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