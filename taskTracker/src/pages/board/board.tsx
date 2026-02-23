import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { taskSocket } from "../../ws/ws";
import { Column } from "../../components/column/column";
import { useAppDispatch } from "../../app/hooks";
import { moveTaskLocal } from "../../components/task/taskSlice";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { TaskCard } from "../../components/ui/taskCard";
import styles from "./board.module.scss";
import TaskForm from "./taskForm/taskForm";
import ProfileSection from "./profile/profile";

type ColumnStatus = "todo" | "in-progress" | "done";

export const BoardPage = () => {
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>();
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const [boardTitle, setBoardTitle] = useState<string>("Загрузка...");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (!boardId || !accessToken) return;

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
  }, [boardId, accessToken]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!boardId) return;
    setActiveTaskId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);

    if (over.data.current?.status) {
      const newStatus = over.data.current.status as ColumnStatus;

      dispatch(moveTaskLocal({ taskId: activeId, newStatus, boardId: boardId! }));

      taskSocket.send({
        type: "MOVE_TASK",
        taskId: activeId,
        newStatus,
        boardId: boardId!,
      });
    }
  }, [boardId]);

  return (
    <div className={styles.iceContainer}>
      <div className={styles.iceBackdrop} />
      <div className={styles.firefliesLayer}>
        {/* fireflies */}
      </div>
      <div className={styles.mistLayer}>
        <div />
      </div>

      <div className={styles.iceNav}>
        <button onClick={() => navigate("/")} className={styles.iceNavBtn}>
          Мои галактики
        </button>
        <button onClick={() => navigate("/")} className={styles.iceNavBtn}>
          ← Вернуться к звёздам
        </button>
        <button
          onClick={() => setInviteOpen(!inviteOpen)}
          className={styles.iceNavBtn}
        >
          {inviteOpen ? "Скрыть зов" : "Позвать спутника"}
        </button>
      </div>

      <section className={styles.iceBoardSection}>
        <h1 className={styles.iceTitle}>{boardTitle}</h1>

        <div className={styles.iceKanbanLayout}>
          <TaskForm inviteOpen={inviteOpen} boardId={boardId!} />

          <div className={styles.iceKanbanMain}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e) => setActiveTaskId(String(e.active.id))}
              onDragEnd={handleDragEnd}
              autoScroll={false}
            >
              <div className={styles.iceKanbanContainer}>
                <Column status="todo" boardId={boardId!} />
                <Column status="in-progress" boardId={boardId!} />
                <Column status="done" boardId={boardId!} />
              </div>

              <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
                {activeTaskId && <TaskCard id={activeTaskId} isOverlay />}
              </DragOverlay>
            </DndContext>
          </div>

          <ProfileSection inviteOpen={inviteOpen} boardId={boardId!} />
        </div>
      </section>
    </div>
  );
};