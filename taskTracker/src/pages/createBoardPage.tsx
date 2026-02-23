import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { nanoid } from "@reduxjs/toolkit";
import styles from "./board.module.scss";

export const CreateBoardsPage = () => {
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const [boards, setBoards] = useState<{ id: string; title: string }[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [boardsError, setBoardsError] = useState<string | null>(null);

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [createBoardError, setCreateBoardError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let mounted = true;

    const fetchBoards = async () => {
      setBoardsLoading(true);
      setBoardsError(null);
      try {
        const res = await fetch("http://localhost:3003/boards", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) setBoards(data || []);
      } catch (err: any) {
        if (mounted) setBoardsError(err.message || "Не удалось загрузить доски");
      } finally {
        if (mounted) setBoardsLoading(false);
      }
    };

    fetchBoards();

    return () => { mounted = false; };
  }, [accessToken]);

  const handleCreateBoard = useCallback(async () => {
    if (!newBoardTitle.trim() || !accessToken) return;
    setCreatingBoard(true);
    setCreateBoardError(null);

    try {
      const res = await fetch("http://localhost:3003/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: newBoardTitle.trim() }),
      });

      if (!res.ok) throw new Error(await res.text());

      const board = await res.json();
      setNewBoardTitle("");
      navigate(`/${board.id}`, { replace: true });
    } catch (err: any) {
      setCreateBoardError(err.message);
    } finally {
      setCreatingBoard(false);
    }
  }, [newBoardTitle, accessToken, navigate]);

  return (
    <div className={styles.iceContainer}>
      <div className={styles.iceBackdrop} />
      <div className={styles.firefliesLayer}>
        {/* Здесь можно добавить fireflies, как в предыдущем коде */}
      </div>
      <div className={styles.mistLayer}>
        <div />
      </div>

      <div className={styles.iceNav}>
        <button onClick={() => navigate("/")} className={styles.iceNavBtn}>
          Мои галактики
        </button>
      </div>

      <section className={styles.iceListSection}>
        <div className={styles.welcomeCosmos}>
          <h1 className={styles.cosmosTitle}>Путешествие среди звёзд</h1>
          <p className={styles.cosmosSubtitle}>Создай свою первую доску и отправься в приключение</p>
          <div className={styles.cameraDeco} />
        </div>

        {boardsLoading && <p className={styles.iceLoading}>Звёзды шепчут...</p>}
        {boardsError && <p className={styles.iceError}>{boardsError}</p>}

        {!boardsLoading && !boardsError && (
          <div className={styles.iceListContent}>
            <div className={styles.iceCreateCard}>
              <input
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Назови свою галактику..."
                className={styles.iceInput}
                spellCheck={false}
              />
              <button
                onClick={handleCreateBoard}
                disabled={creatingBoard || !newBoardTitle.trim()}
                className={`${styles.iceBtn} ${creatingBoard || !newBoardTitle.trim() ? styles.disabled : ""}`}
              >
                {creatingBoard ? "Создаётся..." : "Запустить экспедицию"}
              </button>

              {createBoardError && (
                <div className={styles.iceError}>{createBoardError}</div>
              )}
            </div>

            <div className={styles.iceBoardsGrid}>
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/${board.id}`)}
                  className={styles.iceBoardCard}
                >
                  <h3 className={styles.iceBoardTitle}>{board.title}</h3>
                  <div className={styles.cardIceGlow} />
                  <span className={styles.cardSnowflake}>❄</span>
                </div>
              ))}

              {boards.length === 0 && (
                <p className={styles.iceEmpty}>
                  Космос пуст... Создай первую доску и начни путешествие!
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};