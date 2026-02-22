import { store } from "../app/store"
import { addTaskFromWS, moveTask, deleteTask } from "../components/task/taskSlice"
import type { Task } from "../components/task/types"

export type NewTask = {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  priority: "low" | "medium" | "high"
  createdAt: number
}

type WSMessage =
  | { type: "CREATE_TASK"; task: NewTask }
  | { type: "MOVE_TASK"; taskId: string; newStatus: Task["status"] }
  | { type: "DELETE_TASK"; taskId: string }

class TaskSocket {
  private ws: WebSocket | null = null
  private reconnectTimeout = 1000
  private boardId: string | null = null
  private listeners: ((data: WSMessage) => void)[] = []

  constructor() {}

  // === Новый метод: подключение к комнате ===
  connect(boardId: string) {
    this.boardId = boardId
    this.openSocket()
  }

  // === Новый метод: отключение ===
  disconnect() {
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }

  private getUrl() {
    const state = store.getState()
    const token = state.auth.accessToken

    if (!token || !this.boardId) return null

    return `ws://localhost:3000/ws?token=${token}&room=${this.boardId}`
  }

  private openSocket() {
    const url = this.getUrl()
    if (!url) {
      console.warn("WS: no token or boardId, waiting...")
      setTimeout(() => this.openSocket(), 500)
      return
    }

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log("WS CONNECTED to room:", this.boardId)
      this.reconnectTimeout = 1000
    }

    this.ws.onmessage = (event) => {
      const data: WSMessage = JSON.parse(event.data)

      switch (data.type) {
        case "CREATE_TASK":
          store.dispatch(addTaskFromWS(data.task))
          break

        case "MOVE_TASK":
          store.dispatch(moveTask({ taskId: data.taskId, newStatus: data.newStatus }))
          break

        case "DELETE_TASK":
          store.dispatch(deleteTask(data.taskId))
          break
      }

      this.listeners.forEach(fn => fn(data))
    }

    this.ws.onclose = () => {
      console.log("WS DISCONNECTED, reconnecting...")
      setTimeout(() => this.openSocket(), this.reconnectTimeout)
      this.reconnectTimeout = Math.min(this.reconnectTimeout * 2, 10000)
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  send(data: WSMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WS NOT OPEN, message not sent:", data)
      return
    }

    this.ws.send(JSON.stringify(data))
  }

  subscribe(fn: (data: WSMessage) => void) {
    this.listeners.push(fn)
  }
}

export const taskSocket = new TaskSocket()

if (typeof window !== "undefined") {
  // @ts-ignore
  window.taskSocket = taskSocket
}