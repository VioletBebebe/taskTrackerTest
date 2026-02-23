import { useAppSelector, useAppDispatch } from "../../app/hooks";
import styles from "./taskCard.module.scss";
import { useState } from "react";
import { updateTask, deleteTask } from "../task/taskSlice";
import { taskSocket } from "../../ws/ws";

interface TaskCardProps {
  id: string;
  isOverlay?: boolean;
  isDragging?: boolean;
}

export const TaskCard = ({ id, isOverlay = false, isDragging = false }: TaskCardProps) => {
  const dispatch = useAppDispatch();
  const task = useAppSelector((state) => state.tasks.components[id]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || "");
  const [editedDescription, setEditedDescription] = useState(task?.description || "");
  const [editedPriority, setEditedPriority] = useState(task?.priority || "medium");

  if (!task) {
    return <div className={styles.notFound}>Задача не найдена (id: {id})</div>;
  }

  const handleEdit = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || "");
    setEditedPriority(task.priority);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    const updatedTask = {
      ...task,
      title: editedTitle,
      description: editedDescription,
      priority: editedPriority,
    };
    dispatch(updateTask(updatedTask));
    taskSocket.send({ type: "UPDATE_TASK", task: updatedTask });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Вы уверены, что хотите удалить задачу?")) {
      dispatch(deleteTask(id));
      taskSocket.send({ type: "DELETE_TASK", taskId: id });
    }
  };

  return (
    <div
      className={`${styles.wrapper} ${isDragging ? styles.dragging : ""} ${
        isOverlay ? styles.overlay : ""
      }`}
    >
      {/* Декоративные искорки / снежинки March 7th */}
      <span className={styles.sparkle} style={{ top: "15%", left: "10%" }}>✦</span>
      <span className={styles.sparkle} style={{ top: "25%", right: "12%" }}>❄</span>
      <span className={styles.sparkle} style={{ bottom: "30%", left: "18%" }}>✧</span>
      <span className={styles.sparkle} style={{ bottom: "20%", right: "15%" }}>❅</span>

      {/* Камера March 7th в правом нижнем углу */}
      <div className={styles.cameraDeco}></div>

      {isEditing ? (
        <>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className={styles.editInput}
            placeholder="Название задачи..."
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className={styles.editTextarea}
            placeholder="Описание..."
          />
          <select
            value={editedPriority}
            onChange={(e) => setEditedPriority(e.target.value as "low" | "medium" | "high")}
            className={styles.editSelect}
          >
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
          </select>
          <div className={styles.editButtons}>
            <button onClick={handleSave}>Сохранить</button>
            <button onClick={handleCancel}>Отмена</button>
          </div>
        </>
      ) : (
        <>
          <h3 className={styles.title}>{task.title}</h3>
          {task.description && <p className={styles.description}>{task.description}</p>}

          <div className={styles.meta}>
            <span className={`${styles.priority} ${styles[`priority-${task.priority}`]}`}>
              {task.priority.toUpperCase()}
            </span>
            <span className={styles.date}>
              Создано: {new Date(task.createdAt).toLocaleString("en-GB", {
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
        </>
      )}

      {!isEditing && (
        <div className={styles.actions}>
          <button onClick={handleEdit}>Редактировать</button>
          <button onClick={handleDelete}>Удалить</button>
        </div>
      )}
    </div>
  );
};