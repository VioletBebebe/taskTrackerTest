import { TaskCard } from "../ui/taskCard"
import { useAppSelector, useAppDispatch } from "../../app/hooks"
import { selectTasksByStatus } from "../task/selector"
import { moveTask } from "../task/taskSlice"
import type { Task } from "../task/types"
import styles from "./column.module.scss"


type ColumnProps = {
  status: Task["status"]
  draggedTask: string | null
  setDraggedTask: (id: string | null) => void
}

export const Column = ({ status, draggedTask, setDraggedTask }: ColumnProps) => {
  const dispatch = useAppDispatch()

  const tasks = useAppSelector(state =>
    selectTasksByStatus(state, status)
  )

  const handleDrop = () => {
    if (!draggedTask) return

    dispatch(moveTask({ taskId: draggedTask, newStatus: status }))
      
    setDraggedTask(null)
  }

  return (
    <div
      className={styles.column}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onDragStart={setDraggedTask}
        />
      ))}
    </div>
  )
}