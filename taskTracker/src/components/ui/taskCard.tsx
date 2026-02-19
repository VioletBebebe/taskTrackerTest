import React from "react"
import { Task } from "../task/types"
import styles from "./taskCard.module.scss"

interface TaskCardProps {
  task: Task
  onDragStart: (id: string) => void
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart }) => {
  if (!task) return null

  const date = new Date(task.createdAt)
  const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`

  return (
    <div
      className={styles.wrapper}
      draggable
      onDragStart={() => onDragStart(task.id)}
    >
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p>{task.priority}</p>
      <p>{time}</p>
      <p>{task.user}</p>
    </div>
  )
}