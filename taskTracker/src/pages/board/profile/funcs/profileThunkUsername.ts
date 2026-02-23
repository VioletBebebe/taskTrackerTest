// profileThunks.ts (или добавьте в authThunks.ts)
import { createAsyncThunk } from "@reduxjs/toolkit";
import { updateCurrentProfile } from "./profileSlice"; // ← ваш существующий import из profileSlice
import { authorizedFetch } from "../../../../auth/authThunk"; // ← используем для авто-refresh token, если 401

export const updateBoardUsername = createAsyncThunk(
  "profile/updateUsername",
  async (
    { boardId, newUsername }: { boardId: string; newUsername: string },
    thunkAPI
  ) => {
    const formData = new FormData();
    formData.append("username", newUsername.trim());

    try {
      const res = await authorizedFetch(
        `http://localhost:3004/boards/${boardId}/profile`,
        {
          method: "POST",
          body: formData,
        },
        thunkAPI
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}: Не удалось обновить username`);

      const updatedProfile = await res.json(); // ← сервер должен вернуть обновлённый профиль

      // Обновляем глобальное состояние профиля (как в handleSaveProfile)
      thunkAPI.dispatch(updateCurrentProfile(updatedProfile));

      return updatedProfile;
    } catch (err) {
      return thunkAPI.rejectWithValue((err as Error).message || "Ошибка обновления username");
    }
  }
);
