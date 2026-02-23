import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import styles from "./board.module.scss";
import { updateCurrentProfile } from "./funcs/profileSlice";

interface ProfileSectionProps {
  inviteOpen: boolean;
  boardId: string;
}

const ProfileSection = ({ boardId }: ProfileSectionProps) => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const currentUserName = useAppSelector((state) => state.auth.userName || "Аноним");

  const [participants, setParticipants] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [editUsername, setEditUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [color1, setColor1] = useState("#7efaff"); // более march-7 cyan
  const [color2, setColor2] = useState("#fea2ba"); // более march-7 pink


  const dispatch = useAppDispatch()
  const fetchParticipants = useCallback(async () => {
    if (!boardId || !accessToken) return;
    try {
      const res = await fetch(`http://localhost:3003/boards/${boardId}/participants`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setParticipants(data || []);
    } catch (err) {
      console.error("Не удалось загрузить участников:", err);
    }
  }, [boardId, accessToken]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const isAdmin = useMemo(
    () => participants.some((p) => p.username === currentUserName && p.role === "admin"),
    [participants, currentUserName]
  );

  const currentProfile = useMemo(() => {
    const found = participants.find((p) => p.username === currentUserName);
    return (
      found || {
        username: currentUserName,
        avatar: "https://picsum.photos/id/1005/150/150",
        banner: "https://picsum.photos/id/1015/800/250",
        status: "В гармонии с древним лесом...",
        role: "member",
        nameGradient: "linear-gradient(90deg, #7efaff, #fea2ba)",
      }
    );
  }, [participants, currentUserName]);

  const openProfileModal = () => {
    setEditUsername(currentProfile.username);

    setAvatarPreview(currentProfile.avatar);
    setBannerPreview(currentProfile.banner || "");
    setAvatarFile(null);
    setBannerFile(null);

    // Подставляем сохранённые цвета, если есть
    if (currentProfile.nameGradient) {
      // Простой парсинг — предполагаем формат linear-gradient(90deg, #color1, #color2)
      const match = currentProfile.nameGradient.match(/linear-gradient\(90deg,\s*(#[0-9a-fA-F]{6}),\s*(#[0-9a-fA-F]{6})/);
      if (match) {
        setColor1(match[1]);
        setColor2(match[2]);
      } else {
        setColor1("#7efaff");
        setColor2("#fea2ba");
      }
    } else {
      setColor1("#7efaff");
      setColor2("#fea2ba");
    }

    setShowProfileModal(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!boardId || !accessToken) return;

    const formData = new FormData();
    formData.append("username", editUsername.trim());
    if (avatarFile) formData.append("avatar", avatarFile);
    if (bannerFile) formData.append("banner", bannerFile);

    const nameGradient = `linear-gradient(90deg, ${color1} 0%, ${color2} 50%, ${color1} 100%)`;
    formData.append('nameGradient', nameGradient);

    try {
        const res = await fetch(`http://localhost:3003/boards/${boardId}/profile`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
        });

        if (!res.ok) throw new Error("Не удалось обновить профиль");
        const updatedProfile = await res.json(); // ← сервер должен вернуть обновлённый объект

        dispatch(updateCurrentProfile(updatedProfile));
        setParticipants((prev) =>
            prev.map((p) =>
            p.username === currentUserName
                ? { ...p, username: editUsername.trim(), avatar: avatarPreview, banner: bannerPreview, nameGradient }
                : p
            )
        );

      setShowProfileModal(false);
    } catch (err) {
      console.error("Ошибка сохранения профиля:", err);
      alert("Не удалось сохранить изменения");
    }
  };

  const handleRoleChange = useCallback(
    async (username: string, newRole: "member" | "admin") => {
      if (!isAdmin || !boardId || !accessToken) return;
      try {
        const res = await fetch(`http://localhost:3003/boards/${boardId}/participants/${username}/role`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ role: newRole }),
        });
        if (res.ok) fetchParticipants();
      } catch (err) {
        console.error("Ошибка изменения роли:", err);
      }
    },
    [isAdmin, boardId, accessToken, fetchParticipants]
  );

  const previewGradient = `linear-gradient(90deg, ${color1} 0%, ${color2} 50%, ${color1} 100%)`;
  
  return (
    <aside className={styles.iceRightSidebar}>
      <div className={styles.miniProfile}>
        <div
          className={styles.profileBanner}
          style={{ backgroundImage: currentProfile.banner ? `url(${currentProfile.banner})` : "none" }}
        />
        <div className={styles.profileAvatarContainer}>
          <img src={currentProfile.avatar} alt="Аватар" className={styles.profileAvatar} />
        </div>
        <div className={styles.profileDetails}>
          <h3
            style={{
              background: currentProfile.nameGradient || previewGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 100%",
              animation: "gradientFlow 6s linear infinite",
            }}
          >
            {currentProfile.username}
          </h3>
          <p className={styles.profileStatus}>{currentProfile.status}</p>
          <div className={styles.profileRole}>
            {currentProfile.role === "admin" ? "🌊 Хранитель льда" : "❄️ Спутник"}
          </div>
        </div>
        <button onClick={openProfileModal} className={styles.editProfileBtn}>
          ✎ Редактировать профиль
        </button>
      </div>

      {/* ... participantsSection без изменений ... */}

      {showProfileModal && (
        <div className={styles.profileModalOverlay} onClick={() => setShowProfileModal(false)}>
          <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowProfileModal(false)}>
              ✕
            </button>

            <div
              className={styles.modalBanner}
              style={{
                backgroundImage: bannerPreview
                  ? `url(${bannerPreview})`
                  : currentProfile.banner
                  ? `url(${currentProfile.banner})`
                  : "none",
              }}
            />

            <div className={styles.modalAvatarWrapper}>
              <img src={avatarPreview || currentProfile.avatar} alt="Аватар" className={styles.modalAvatar} />
            </div>

            <h2
              className={styles.modalUsername}
              style={{
                backgroundImage: previewGradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize: "200% 100%",
                animation: "gradientFlow 6s linear infinite",

              }}
            >
              {editUsername || currentProfile.username}
            </h2>
            <div className={styles.modalContent}>
              <div className={styles.modalField}>
                <label>Имя пользователя</label>
                <input
                  type="text"
                  onChange={(e) => setEditUsername(e.target.value)}
                  className={styles.modalInput}
                  placeholder="Новое имя..."
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
                  />
                  <label htmlFor="banner-upload" className={styles.fileBtn}>
                    Выбрать баннер
                  </label>
                </div>

                <div className={styles.colorPickers}>
                  <div>
                    <label>Цвет 1</label>
                    <input
                      type="color"
                      value={color1}
                      onChange={(e) => setColor1(e.target.value)}
                      className={styles.modalColorPicker}
                    />
                  </div>
                  <div>
                    <label>Цвет 2</label>
                    <input
                      type="color"
                      value={color2}
                      onChange={(e) => setColor2(e.target.value)}
                      className={styles.modalColorPicker}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button onClick={handleSaveProfile} className={styles.saveBtn}>
                  Сохранить
                </button>
                <button onClick={() => setShowProfileModal(false)} className={styles.cancelBtn}>
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