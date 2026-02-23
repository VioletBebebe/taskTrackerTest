import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppSelector } from "../../app/hooks";
import { selectTasksByBoardAndStatus } from "../task/selector";
import { TaskCard } from "../ui/taskCard";
import React from "react";

import styles from "./column.module.scss";

export type TaskStatus = "todo" | "in-progress" | "done";

export interface ColumnProps {
  status: TaskStatus;
  boardId: string;
}

export const Column = React.memo(({ status, boardId }: ColumnProps) => {
  const tasks = useAppSelector((state) =>
    selectTasksByBoardAndStatus(state, boardId, status)
  );

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status, type: "Column", boardId },
  });

  const taskIds = tasks.map((t) => t.id);

  const title =
    status === "todo" ? "Надо типо " :
    status === "in-progress" ? "В работе" :
    "Готово";

  const columnModifier = `column-${status}`;

  return (
    <div
      ref={setDroppableRef}
      className={`${styles.column} ${styles[columnModifier]} ${isOver ? styles.over : ""}`}
    >
      <div className={styles.headerWrapper}>
        <h3 className={styles.header}>
          {title}
        </h3>

        <div className={styles.taskCountWrapper}>
          <span className={styles.taskCount}>{tasks.length}</span>
          <span className={styles.taskCountLabel}>
            {tasks.length === 0
              ? "задач"
              : tasks.length % 10 === 1 && tasks.length % 100 !== 11
                ? "задача"
                : (tasks.length % 10 >= 2 && tasks.length % 10 <= 4) &&
                    (tasks.length % 100 < 10 || tasks.length % 100 >= 20)
                  ? "задачи"
                  : "задач"}
          </span>
        </div>

        <span className={`${styles.sparkle} ${styles.sparkle1}`}>❄</span>
        <span className={`${styles.sparkle} ${styles.sparkle2}`}>✦</span>
        <span className={`${styles.sparkle} ${styles.sparkle3}`}>❅</span>
        <span className={`${styles.sparkle} ${styles.sparkle4}`}>✧</span>
        <span className={`${styles.sparkle} ${styles.sparkle5}`}>★</span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <SortableTask key={task.id} id={task.id} status={status} />
          ))}

          {tasks.length === 0 && (
            <div className={styles.emptyState}>
              Пока пусто... ❄
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
});

function SortableTask({ id, status }: { id: string; status: TaskStatus }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { status, type: "Task" },
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    transformOrigin: "top left",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${isDragging ? styles.draggingTask : ""}`}
    >
      <TaskCard id={id} isDragging={isDragging} />
    </div>
  );
}