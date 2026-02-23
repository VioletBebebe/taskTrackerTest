import { useState, useCallback } from "react";
import { taskSocket, NewTask } from "../../../ws/ws";
import { nanoid } from "@reduxjs/toolkit";
import { useAppSelector } from "../../../app/hooks";
import styles from "./board.module.scss";

type Priority = "low" | "medium" | "high";

interface TaskFormProps {
  inviteOpen: boolean;
  boardId: string;
}

const TaskForm = ({ inviteOpen, boardId }: TaskFormProps) => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const currentUserName = useAppSelector(state => state.auth.userName || "Аноним");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("low");

  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const handleCreateTask = useCallback(() => {
    if (!taskTitle.trim() || !boardId) return;

    const newTask: NewTask = {
      id: nanoid(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      status: "todo" as const,
      priority: taskPriority,
      createdAt: Date.now(),
      boardId: boardId!,
      userName: currentUserName,
    };

    taskSocket.send({ type: "CREATE_TASK", task: newTask });

    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("low");
  }, [taskTitle, taskDescription, taskPriority, boardId, currentUserName]);

  const handleInvite = useCallback(async () => {
    if (!inviteUsername.trim() || !boardId || !accessToken) return;

    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch(`http://localhost:3003/boards/${boardId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ username: inviteUsername.trim() }),
      });

      if (!res.ok) throw new Error(await res.text());

      setInviteSuccess("Пользователь приглашён");
      setInviteUsername("");
    } catch (err: any) {
      setInviteError(err.message || "Ошибка приглашения");
    }
  }, [inviteUsername, boardId, accessToken]);

  return (
    <aside className={styles.iceSidebar}>
      <div className={styles.iceTaskForm}>
        <div className={styles.iceGlowWrapper}>
          <div className={styles.fireflyLayer} />

          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Назови задачу... как звезду?"
            className={styles.iceInput}
            spellCheck={false}
          />

          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Что нужно сделать в этом полёте?"
            className={styles.iceTextarea}
            rows={3}
          />

          <div className={styles.customSelectWrapper}>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as Priority)}
              className={styles.icePrioritySelect}
            >
              <option value="" disabled hidden>Уровень важности...</option>
              <option value="low">Спокойный полёт</option>
              <option value="medium">Стандартная орбита</option>
              <option value="high">Экстренный манёвр</option>
            </select>
            <span className={styles.selectArrow}>❄</span>
          </div>

          <button
            onClick={handleCreateTask}
            disabled={!taskTitle.trim()}
            className={`${styles.iceButton} ${!taskTitle.trim() ? styles.disabled : ""}`}
          >
            <span className={styles.btnGlow}>Запустить задачу</span>
            <div className={styles.buttonIce} />
          </button>
        </div>
      </div>

      {inviteOpen && (
        <div className={styles.iceInviteForm}>
          <h3 className={styles.sidebarTitle}>Пригласить в экспедицию</h3>

          <div className={styles.inviteRow}>
            <input
              placeholder="Имя спутника"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              className={styles.iceInput}
            />
            <button
              onClick={handleInvite}
              disabled={!inviteUsername.trim()}
              className={`${styles.iceBtn} ${styles.iceInviteBtn} ${
                !inviteUsername.trim() ? styles.disabled : ""
              }`}
            >
              Отправить сигнал
            </button>
          </div>

          {inviteError && <div className={styles.iceError}>{inviteError}</div>}
          {inviteSuccess && <div className={styles.iceSuccess}>{inviteSuccess}</div>}
        </div>
      )}
    </aside>
  );
};

export default TaskForm;