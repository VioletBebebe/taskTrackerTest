import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import styles from "./board.module.scss";
import { saveUserProfile, updateCurrentProfile } from "./funcs/profileSlice";

/** ============================
 * Типы
 * ============================ */
interface ProfileSectionProps {
  boardId: string;
}

type Role = "admin" | "member";

interface Profile {
  username: string;
  avatar: string;
  banner?: string;
  status?: string;
  role: Role;
  nameGradient?: string;
}

interface Participant {
  username: string;
  role: Role;
  avatar?: string;
  status?: string;
}

/** ============================
 * Константы и утилиты
 * ============================ */
const DEFAULT_AVATAR = "/default/avatar.png";
const DEFAULT_BANNER = "/default/banner.png";
const DEFAULT_STATUS = "В гармонии с древним лесом...";
const DEFAULT_COLOR_1 = "#7efaff";
const DEFAULT_COLOR_2 = "#fea2ba";

const buildGradient = (c1: string, c2: string) =>
  `linear-gradient(90deg, ${c1} 0%, ${c2} 50%, ${c1} 100%)`;

// Пытаемся достать первые два #RRGGBB из строки градиента
const parseGradient = (
  gradient?: string
): { c1: string; c2: string } => {
  if (!gradient) return { c1: DEFAULT_COLOR_1, c2: DEFAULT_COLOR_2 };
  const match = gradient.match(
    /linear-gradient\(90deg,\s*(#[0-9a-fA-F]{6})[^,]*,\s*(#[0-9a-fA-F]{6})/i
  );
  if (match && match[1] && match[2]) {
    return { c1: match[1], c2: match[2] };
  }
  return { c1: DEFAULT_COLOR_1, c2: DEFAULT_COLOR_2 };
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3004";

/** ============================
 * Компонент
 * ============================ */
const ProfileSection: React.FC<ProfileSectionProps> = ({ boardId }) => {
  const dispatch = useAppDispatch();

  // --- Auth
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const currentUserName = useAppSelector((s) => s.auth.userName || "Аноним");

  // --- Профиль из стора + безопасный fallback
  const rawProfile = useAppSelector((s) => s.profile.currentProfile as Profile | null);

  const currentProfile: Profile = useMemo(
    () =>
      rawProfile ?? {
        username: currentUserName,
        avatar: DEFAULT_AVATAR,
        banner: DEFAULT_BANNER,
        status: DEFAULT_STATUS,
        role: "member",
        nameGradient: buildGradient(DEFAULT_COLOR_1, DEFAULT_COLOR_2),
      },
    [rawProfile, currentUserName]
  );

  // --- Участники
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState<boolean>(false);

  // --- Модалка
  const [showProfileModal, setShowProfileModal] = useState(false);

  // --- Состояние формы профиля
  const [editStatus, setEditStatus] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");

  const [color1, setColor1] = useState<string>(DEFAULT_COLOR_1);
  const [color2, setColor2] = useState<string>(DEFAULT_COLOR_2);

  const [isSaving, setIsSaving] = useState<boolean>(false);

  // refs для хранения предыдущих blob-URL, чтобы корректно их очищать
  const prevAvatarPreviewRef = useRef<string>("");
  const prevBannerPreviewRef = useRef<string>("");

  // ============================
  // Загрузка участников
  // ============================
  const fetchParticipants = useCallback(async () => {
    if (!boardId || !accessToken) return;

    setIsLoadingParticipants(true);
    setParticipantsError(null);

    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/participants`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: Participant[] = await res.json();
      setParticipants(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Не удалось загрузить участников:", err);
      setParticipantsError(err?.message ?? "Ошибка загрузки участников");
    } finally {
      setIsLoadingParticipants(false);
    }
  }, [boardId, accessToken]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // ============================
  // Определение роли текущего пользователя
  // ============================
  const isAdmin = useMemo(
    () => participants.some((p) => p.username === currentUserName && p.role === "admin"),
    [participants, currentUserName]
  );

  // ============================
  // Открытие модалки
  // ============================
  const openProfileModal = () => {
    setEditStatus(currentProfile.status ?? "");
    setAvatarFile(null);
    setBannerFile(null);

    // Начальные предпросмотры — берём из профиля
    setAvatarPreview(currentProfile.avatar || DEFAULT_AVATAR);
    setBannerPreview(currentProfile.banner || "");

    // Цвета имени: парсим существующий градиент
    const { c1, c2 } = parseGradient(currentProfile.nameGradient);
    setColor1(c1);
    setColor2(c2);

    setShowProfileModal(true);
  };

  // ============================
  // Обработчики файлов + управление blob-URL
  // ============================
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);

    // очистить предыдущий blob-URL
    if (prevAvatarPreviewRef.current && prevAvatarPreviewRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(prevAvatarPreviewRef.current);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      prevAvatarPreviewRef.current = url;
      setAvatarPreview(url);
    } else {
      prevAvatarPreviewRef.current = "";
      setAvatarPreview(currentProfile.avatar || DEFAULT_AVATAR);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setBannerFile(file);

    // очистить предыдущий blob-URL
    if (prevBannerPreviewRef.current && prevBannerPreviewRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(prevBannerPreviewRef.current);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      prevBannerPreviewRef.current = url;
      setBannerPreview(url);
    } else {
      prevBannerPreviewRef.current = "";
      setBannerPreview(currentProfile.banner || "");
    }
  };

  // Очистить blob-URL при размонтировании
  useEffect(() => {
    return () => {
      if (prevAvatarPreviewRef.current && prevAvatarPreviewRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(prevAvatarPreviewRef.current);
      }
      if (prevBannerPreviewRef.current && prevBannerPreviewRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(prevBannerPreviewRef.current);
      }
    };
  }, []);

  // ============================
  // Сохранение профиля
  // ============================
  const handleSaveProfile = async () => {
    if (!boardId || !accessToken) return;

    const formData = new FormData();
    if (avatarFile) formData.append("avatar", avatarFile);
    if (bannerFile) formData.append("banner", bannerFile);

    formData.append("status", editStatus.trim());
    formData.append("nameGradient", buildGradient(color1, color2));

    setIsSaving(true);
    try {
      const updatedProfile = await dispatch(
        saveUserProfile({ boardId, formData })
      ).unwrap();

      // Обновляем профиль в сторе
      dispatch(updateCurrentProfile(updatedProfile));

      // Обновляем участников (вдруг роль/аватар/статус где-то используются)
      await fetchParticipants();

      setShowProfileModal(false);
    } catch (err: any) {
      console.error("Ошибка сохранения профиля:", err);
      alert("Не удалось сохранить изменения: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // ============================
  // Изменение роли
  // ============================
  const handleRoleChange = useCallback(
    async (username: string, newRole: Role) => {
      if (!isAdmin || !boardId || !accessToken) return;
      try {
        const res = await fetch(
          `${API_URL}/boards/${boardId}/participants/${encodeURIComponent(username)}/role`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ role: newRole }),
          }
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        await fetchParticipants();
      } catch (err) {
        console.error("Ошибка изменения роли:", err);
        alert("Не удалось изменить роль: " + (err as Error).message);
      }
    },
    [isAdmin, boardId, accessToken, fetchParticipants]
  );

  // ============================
  // Вычисления для UI
  // ============================
  const usernameGradientStyle: React.CSSProperties = {
    backgroundImage: currentProfile.nameGradient || buildGradient(DEFAULT_COLOR_1, DEFAULT_COLOR_2),
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundSize: "200% 100%",
    animation: "gradientFlow 6s linear infinite",
  };

  const modalUsernameGradientStyle: React.CSSProperties = {
    backgroundImage: buildGradient(color1, color2),
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundSize: "200% 100%",
    animation: "gradientFlow 6s linear infinite",
  };

  const avatarSrc =
    avatarPreview || currentProfile.avatar || DEFAULT_AVATAR;

  const bannerStyle: React.CSSProperties = {
    backgroundImage: currentProfile.banner ? `url(${currentProfile.banner})` : "none",
  };

  const modalBannerStyle: React.CSSProperties = {
    backgroundImage: bannerPreview
      ? `url(${bannerPreview})`
      : currentProfile.banner
      ? `url(${currentProfile.banner})`
      : "none",
  };

  return (
    <aside className={styles.iceRightSidebar}>
      {/* Мини-профиль */}
      <div className={styles.miniProfile}>
        <div className={styles.profileBanner} style={bannerStyle} />
        <div className={styles.profileAvatarContainer}>
          <img
            src={currentProfile.avatar || DEFAULT_AVATAR}
            alt="Аватар"
            className={styles.profileAvatar}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
          />
        </div>
        <div className={styles.profileDetails}>
          <h3 style={usernameGradientStyle}>
            {currentProfile.username}
          </h3>
          <p className={styles.profileStatus}>{currentProfile.status || DEFAULT_STATUS}</p>
          <div className={styles.profileRole}>
            {currentProfile.role === "admin" ? "🌊 Хранитель льда" : "❄️ Спутник"}
          </div>
        </div>
        <button
          type="button"
          onClick={openProfileModal}
          className={styles.editProfileBtn}
          disabled={!accessToken}
          aria-disabled={!accessToken}
        >
          ✎ Редактировать профиль
        </button>
      </div>

      {/* Участники */}
      <section className={styles.participantsSection}>
        <div className={styles.participantsHeader}>
          <h4>Участники</h4>
          {isLoadingParticipants && <span className={styles.muted}>Загрузка…</span>}
          {participantsError && <span className={styles.errorText}>{participantsError}</span>}
        </div>

        <ul className={styles.participantsList}>
          {participants.map((p) => (
            <li key={p.username} className={styles.participantItem}>
              <img
                className={styles.participantAvatar}
                src={p.avatar || DEFAULT_AVATAR}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
              <div className={styles.participantBody}>
                <div className={styles.participantRow}>
                  <span className={styles.participantName}>{p.username}</span>
                  <span className={styles.participantRoleBadge}>
                    {p.role === "admin" ? "Админ" : "Участник"}
                  </span>
                </div>
                {isAdmin && p.username !== currentUserName && (
                  <div className={styles.participantControls}>
                    <label className={styles.muted} htmlFor={`role-${p.username}`}>
                      Роль:
                    </label>
                    <select
                      id={`role-${p.username}`}
                      className={styles.roleSelect}
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.username, e.target.value as Role)}
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                )}
              </div>
            </li>
          ))}
          {participants.length === 0 && !isLoadingParticipants && (
            <li className={styles.muted}>Пока нет участников</li>
          )}
        </ul>
      </section>

      {/* Модалка профиля */}
      {showProfileModal && (
        <div
          className={styles.profileModalOverlay}
          onClick={() => !isSaving && setShowProfileModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.profileModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setShowProfileModal(false)}
              disabled={isSaving}
              aria-label="Закрыть"
            >
              ✕
            </button>

            <div className={styles.modalBanner} style={modalBannerStyle} />
            <div className={styles.modalAvatarWrapper}>
              <img
                src={avatarSrc}
                alt="Аватар"
                className={styles.modalAvatar}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
            </div>

            {/* Имя не редактируется */}
            <h2 className={styles.modalUsername} style={modalUsernameGradientStyle}>
              {currentProfile.username}
            </h2>

            <div className={styles.modalContent}>
              <div className={styles.modalField}>
                <label htmlFor="status-input">Статус</label>
                <input
                  id="status-input"
                  type="text"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={styles.modalInput}
                  placeholder="Новый статус..."
                  disabled={isSaving}
                />
              </div>

              <div className={styles.inputsRow}>
                <div className={styles.customFileUpload}>
                  <input
                    className={styles.inputImg}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    id="avatar-upload"
                    disabled={isSaving}
                  />
                  <label htmlFor="avatar-upload" className={styles.fileBtn}>
                    Выбрать аватар
                  </label>
                </div>

                <div className={styles.customFileUpload}>
                  <input
                    className={styles.inputImg}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    id="banner-upload"
                    disabled={isSaving}
                  />
                  <label htmlFor="banner-upload" className={styles.fileBtn}>
                    Выбрать баннер
                  </label>
                </div>

                <div className={styles.colorPickers}>
                  <div>
                    <label htmlFor="color-1">Цвет 1</label>
                    <input
                      id="color-1"
                      type="color"
                      value={color1}
                      onChange={(e) => setColor1(e.target.value)}
                      className={styles.modalColorPicker}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label htmlFor="color-2">Цвет 2</label>
                    <input
                      id="color-2"
                      type="color"
                      value={color2}
                      onChange={(e) => setColor2(e.target.value)}
                      className={styles.modalColorPicker}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  onClick={handleSaveProfile}
                  className={styles.saveBtn}
                  disabled={isSaving || !accessToken}
                >
                  {isSaving ? "Сохранение…" : "Сохранить"}
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className={styles.cancelBtn}
                  disabled={isSaving}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ProfileSection;