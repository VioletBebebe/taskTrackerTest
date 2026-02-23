// src/features/profile/profileSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  username: string;
  displayName?: string;           // на случай, если захочешь отдельно от username
  avatar: string;                 // url
  banner?: string;                // url или null/undefined
  status?: string;
  role: 'member' | 'admin' | 'owner'; // можно расширить
  nameGradient?: string;          // "linear-gradient(135deg, #7efaff, #fea2ba)"
  gradientColor1?: string;        // #7efaff    ← удобно для редактирования
  gradientColor2?: string;        // #fea2ba
  updatedAt?: string;             // ISO строка, для отображения "последнее обновление"
  // можно добавить позже: theme?: 'light' | 'dark' | 'custom';
  // bio?: string;
  // socialLinks?: { twitter?: string; discord?: string };
}

interface ProfileState {
  currentProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  // participants: Record<string, UserProfile>;   ← если захочешь кэшировать всех участников доски
}

const initialState: ProfileState = {
  currentProfile: null,
  isLoading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Устанавливаем профиль полностью (при логине / загрузке доски)
    setCurrentProfile(state, action: PayloadAction<UserProfile>) {
      state.currentProfile = action.payload;
      state.error = null;
    },

    // Частичное обновление (оптимистичные обновления + после успешного запроса)
    updateCurrentProfile(state, action: PayloadAction<Partial<UserProfile>>) {
      if (state.currentProfile) {
        state.currentProfile = {
          ...state.currentProfile,
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    // Сброс при логауте / выходе из доски
    clearProfile(state) {
      state.currentProfile = null;
      state.error = null;
    },

    // Для индикации загрузки (если используешь async thunks)
    setProfileLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    setProfileError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

// Экспортируем actions
export const {
  setCurrentProfile,
  updateCurrentProfile,
  clearProfile,
  setProfileLoading,
  setProfileError,
} = profileSlice.actions;

// Селекторы (удобно использовать в useAppSelector)
export const selectCurrentProfile = (state: { profile: ProfileState }) =>
  state.profile.currentProfile;

export const selectProfileLoading = (state: { profile: ProfileState }) =>
  state.profile.isLoading;

export const selectProfileError = (state: { profile: ProfileState }) =>
  state.profile.error;

export const selectHasAdminRights = (state: { profile: ProfileState }) =>
  state.profile.currentProfile?.role === 'admin' ||
  state.profile.currentProfile?.role === 'owner';

// Пример: готовый градиент с fallback-ом
export const selectNameGradient = (state: { profile: ProfileState }) => {
  const p = state.profile.currentProfile;
  if (!p) return 'linear-gradient(90deg, #7efaff, #fea2ba)';

  if (p.nameGradient) return p.nameGradient;

  // fallback на отдельные цвета, если строка не пришла
  const c1 = p.gradientColor1 || '#7efaff';
  const c2 = p.gradientColor2 || '#fea2ba';
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 50%, ${c1} 100%)`;
};

export default profileSlice.reducer;