import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { nanoid } from "@reduxjs/toolkit";
import { taskSocket, NewTask } from "../ws/ws";
import { Column } from "../components/column/column";
import { moveTaskLocal } from "../components/task/taskSlice";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { TaskCard } from "../components/ui/taskCard";

import styles from "./board.module.scss";

type Priority = "low" | "medium" | "high";
type ColumnStatus = "todo" | "in-progress" | "done";
type Board = { id: string; title: string };

export const BoardsDashboard = () => {
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId?: string }>();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const mode = boardId ? "board" : "list";

  const [boardTitle, setBoardTitle] = useState<string>("Загрузка...");

  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [boardsError, setBoardsError] = useState<string | null>(null);

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [createBoardError, setCreateBoardError] = useState<string | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("low");

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (mode !== "list" || !accessToken) return;

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
  }, [mode, accessToken]);

  useEffect(() => {
    if (mode !== "board" || !boardId || !accessToken) return;

    taskSocket.connect(boardId);

    const fetchBoard = async () => {
      try {
        const res = await fetch(`http://localhost:3003/boards/${boardId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Не удалось загрузить доску");
        const board = await res.json();
        setBoardTitle(board.title || "Без названия");
      } catch {
        setBoardTitle("Ошибка загрузки");
      }
    };

    fetchBoard();

    return () => taskSocket.disconnect();
  }, [mode, boardId, accessToken]);

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
      navigate(`/boards/${board.id}`, { replace: true });
    } catch (err: any) {
      setCreateBoardError(err.message);
    } finally {
      setCreatingBoard(false);
    }
  }, [newBoardTitle, accessToken, navigate]);

  const handleCreateTask = useCallback(() => {
    if (!taskTitle.trim()) return;

    const newTask: NewTask = {
      id: nanoid(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      status: "todo" as const,
      priority: taskPriority,
      createdAt: Date.now(),
    };

    taskSocket.send({ type: "CREATE_TASK", task: newTask });

    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("low");
  }, [taskTitle, taskDescription, taskPriority]);

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTaskId(null);

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (over.data.current?.status) {
      const newStatus = over.data.current.status as ColumnStatus;

      dispatch(moveTaskLocal({ taskId: activeId, newStatus }));
      taskSocket.send({
        type: "MOVE_TASK",
        taskId: activeId,
        newStatus,
      });
      return;
    }

    const overTask = useAppSelector(state => state.tasks.components[overId]);

    if (overTask) {
      const targetStatus = overTask.status as ColumnStatus;

      const activeTask = useAppSelector(state => state.tasks.components[activeId]);

      if (activeTask && activeTask.status !== targetStatus) {
        dispatch(moveTaskLocal({ taskId: activeId, newStatus: targetStatus }));
        taskSocket.send({
          type: "MOVE_TASK",
          taskId: activeId,
          newStatus: targetStatus,
        });
      }
    }
  }, [dispatch]);

  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <button onClick={() => navigate("/boards")} className={styles.navBtn}>
          Мои доски
        </button>

        {mode === "board" && (
          <>
            <button onClick={() => navigate("/boards")} className={styles.navBtn}>
              ← Назад
            </button>

            <button onClick={() => setInviteOpen(!inviteOpen)} className={styles.navBtn}>
              {inviteOpen ? "Скрыть приглашение" : "Пригласить пользователя"}
            </button>
          </>
        )}
      </div>

      {mode === "list" && (
        <section className={styles.listSection}>
          <h1 className={styles.title}>Мои доски</h1>

          {boardsLoading && <p className={styles.loading}>Загрузка...</p>}
          {boardsError && <p className={styles.error}>{boardsError}</p>}

          {!boardsLoading && !boardsError && (
            <>
              <div className={styles.createForm}>
                <input
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="Название новой доски"
                  className={styles.input}
                />
                <button
                  onClick={handleCreateBoard}
                  disabled={creatingBoard || !newBoardTitle.trim()}
                  className={`${styles.btn} ${styles.createBtn} ${
                    creatingBoard || !newBoardTitle.trim() ? styles.btnDisabled : ""
                  }`}
                >
                  {creatingBoard ? "Создаётся..." : "Создать доску"}
                </button>

                {createBoardError && (
                  <div className={styles.errorMsg}>{createBoardError}</div>
                )}
              </div>

              <div className={styles.boardsGrid}>
                {boards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => navigate(`/boards/${board.id}`)}
                    className={styles.boardCard}
                  >
                    <h3 className={styles.boardTitle}>{board.title}</h3>
                  </div>
                ))}

                {boards.length === 0 && (
                  <p className={styles.emptyText}>
                    У вас пока нет досок. Создайте первую!
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {mode === "board" && boardId && (
        <section className={styles.boardSection}>
          <h1 className={styles.title}>{boardTitle}</h1>

          {inviteOpen && (
            <div className={styles.inviteBox}>
              <div className={styles.inviteRow}>
                <input
                  placeholder="username"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  className={styles.input}
                />
                <button
                  onClick={handleInvite}
                  disabled={!inviteUsername.trim()}
                  className={`${styles.btn} ${styles.inviteBtn} ${
                    !inviteUsername.trim() ? styles.btnDisabled : ""
                  }`}
                >
                  Пригласить
                </button>
              </div>

              {inviteError && <div className={styles.errorMsg}>{inviteError}</div>}
              {inviteSuccess && <div className={styles.successMsg}>{inviteSuccess}</div>}
            </div>
          )}

          <div className={styles.taskForm}>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Название задачи"
              className={styles.input}
            />
            <input
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Описание"
              className={styles.input}
            />
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as Priority)}
              className={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button
              onClick={handleCreateTask}
              disabled={!taskTitle.trim()}
              className={`${styles.btn} ${styles.addBtn} ${
                !taskTitle.trim() ? styles.btnDisabled : ""
              }`}
            >
              Добавить задачу
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveTaskId(String(e.active.id))}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.kanbanContainer}>
              <Column status="todo" />
              <Column status="in-progress" />
              <Column status="done" />
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
              {activeTaskId && <TaskCard id={activeTaskId} isOverlay />}
            </DragOverlay>
          </DndContext>
        </section>
      )}
    </div>
  );
};