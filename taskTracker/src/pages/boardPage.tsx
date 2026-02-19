import { nanoid } from "@reduxjs/toolkit"
import { taskSocket } from "../ws/ws"
import { Column } from "../components/column/column"
import { useState } from "react"
import style from "./taskCard.module.scss"



type Priority = "Low" | "Medium" | "High"

export const BoardPage = () => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>("Low")
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  
  const create = () => {
    if (!title.trim()) return

    const newTask = {
      id: nanoid(),
      title,
      description,
      status: "done",
      priority,
      createdAt: Date.now(),
      user: "Няшка"
    } as const

    taskSocket.send(newTask)

    setTitle("")
    setDescription("")
    setPriority("Low")
  }

  return (
    <div className={style.board}>

      <div
        className="wrapper"
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "center"
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Название"
        />

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="Описание"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <button
          onClick={create}
          style={{
            padding: "10px 18px",
            background: "#4f46e5",
            color: "white",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
            transition: "0.2s"
          }}
        >
          Добавить
        </button>
      </div>

        <Column status="todo" draggedTask={draggedTask} setDraggedTask={setDraggedTask} />
        <Column status="in-progress" draggedTask={draggedTask} setDraggedTask={setDraggedTask} />
        <Column status="done" draggedTask={draggedTask} setDraggedTask={setDraggedTask} />
    </div>
  )
}