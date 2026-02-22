import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppSelector } from "../../app/hooks";
import styles from "./taskCard.module.scss";

interface TaskCardProps {
  id: string;
  isOverlay?: boolean;
  isDragging?: boolean;
}

export const TaskCard = ({ id, isOverlay = false, isDragging = false }: TaskCardProps) => {
  const task = useAppSelector((state) => state.tasks.components[id]);

  if (!task) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.notFound}>Задача не найдена (id: {id})</p>
      </div>
    );
  }

  const { status } = task;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    data: { status },
    animateLayoutChanges: () => false,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`${styles.wrapper} ${isDragging ? styles.dragging : ""} ${
        isOverlay ? styles.overlay : ""
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 0.2s ease",
      }}
    >
      <h3 className={styles.title}>{task.title}</h3>

      {task.description && <p className={styles.description}>{task.description}</p>}

      <div className={styles.meta}>
        <span className={`${styles.priority} ${styles[`priority-${task.priority}`]}`}>
          {task.priority}
        </span>
        <span className={styles.date}>
          Создано: {new Date(task.createdAt).toLocaleString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {task.userName && (
        <div className={styles.author}>
          <span className={styles.authorLabel}>Создал:</span>
          <strong>{task.userName}</strong>
        </div>
      )}
    </div>
  );
};