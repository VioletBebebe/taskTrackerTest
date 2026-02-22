import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppSelector } from "../../app/hooks";
import { selectTasksByStatus } from "../task/selector";
import { TaskCard } from "../ui/taskCard";

import styles from "./column.module.scss";

export type TaskStatus = "todo" | "in-progress" | "done";

export interface ColumnProps {
  status: TaskStatus;
}

export const Column = ({ status }: ColumnProps) => {
  const tasks = useAppSelector((state) => selectTasksByStatus(state, status));

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `column-${status}`,
    data: { status, type: "Column" },
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div ref={setDroppableRef} className={styles.column}>
      <h3 className={styles.header}>
        {status === "in-progress" ? "В работе" : status.charAt(0).toUpperCase() + status.slice(1)}
        <span className={styles.taskCount}>{tasks.length}</span>
      </h3>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <SortableTask key={task.id} id={task.id} status={status} />
          ))}
        </div>
      </SortableContext>

      {tasks.length === 0 && (
        <div className={styles.emptyState}>
          Перетащите сюда задачу
        </div>
      )}
    </div>
  );
};

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

  return (
    <div
      ref={setNodeRef}
      className={`${styles.sortableItem} ${isDragging ? styles.dragging : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <TaskCard id={id} isDragging={isDragging} />
    </div>
  );
}