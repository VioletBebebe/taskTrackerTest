import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../../../app/store";

export interface Profile {

  avatar: string;
  banner?: string;
  status: string;
  nameGradient?: string;
  role?: "member" | "admin";
}

interface ProfileState {
  currentProfile: Profile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  currentProfile: null,
  loading: false,
  error: null,
};

// Универсальный thunk: создаёт или обновляет профиль
export const saveUserProfile = createAsyncThunk<
  Profile,
  { boardId: string; formData: FormData },
  { state: RootState }
>(
  "profile/saveUserProfile",
  async ({ boardId, formData }, { getState, rejectWithValue }) => {
    const accessToken = getState().auth.accessToken;
    if (!accessToken) return rejectWithValue("Отсутствует токен");

    const res = await fetch(`http://localhost:3004/boards/${boardId}/profile`, {
      method: "POST", // сервер сам решает create/update
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      return rejectWithValue(err || "Ошибка сохранения профиля");
    }

    return (await res.json()) as Profile;
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    updateCurrentProfile: (state, action: PayloadAction<Profile>) => {
      state.currentProfile = action.payload;
    },
    clearCurrentProfile: (state) => {
      state.currentProfile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProfile = action.payload;
      })
      .addCase(saveUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateCurrentProfile, clearCurrentProfile } = profileSlice.actions;
export default profileSlice.reducer;