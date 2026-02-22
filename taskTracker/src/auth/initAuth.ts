import { createAsyncThunk } from "@reduxjs/toolkit";
import { refreshToken } from "./authThunk";
import { markInitialized } from "./authSlice";

export const initAuth = createAsyncThunk(
  "auth/init",
  async (_, { dispatch }) => {
    const result = await dispatch(refreshToken());

    if (refreshToken.rejected.match(result)) {
    // refresh не удался — пользователь гость
    }
    dispatch(markInitialized());

  }
);