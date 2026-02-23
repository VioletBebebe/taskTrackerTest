import { store } from "../app/store"
import { addTaskFromWS, moveTask, deleteTask, updateTask } from "../components/task/taskSlice"
import type { Task } from "../components/task/types"

export type ColumnStatus = "todo" | "in-progress" | "done"

export interface NewTask {
  id: string
  title: string
  description: string
  status: ColumnStatus
  priority: "low" | "medium" | "high"
  createdAt: number
  boardId: string
  userName: string
}

export type WSMessage =
  | { type: "CREATE_TASK"; task: NewTask }
  | { type: "MOVE_TASK"; taskId: string; newStatus: ColumnStatus; boardId: string }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "UPDATE_TASK"; task: any }

class TaskSocket {
  private ws: WebSocket | null = null
  private reconnectTimeout = 1000
  private maxReconnectTimeout = 10000
  private boardId: string | null = null
  private listeners: ((data: WSMessage) => void)[] = []

  constructor() {
    // Автоматический реконнект при потере соединения
    window.addEventListener("online", () => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.reconnect()
      }
    })
  }

  connect(boardId: string) {
    if (this.boardId === boardId && this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected to board:", boardId)
      return
    }

    this.boardId = boardId
    this.openSocket()
  }

  disconnect() {
    if (this.ws) {
      console.log("[WS] Disconnecting from board:", this.boardId)
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    this.boardId = null
  }

  private getUrl(): string | null {
    const token = store.getState().auth.accessToken

    if (!token) {
      console.warn("[WS] No access token available")
      return null
    }

    if (!this.boardId) {
      console.warn("[WS] No boardId set")
      return null
    }

    const url = `ws://localhost:3000/ws?token=${encodeURIComponent(token)}&boardId=${encodeURIComponent(this.boardId)}`
    console.log("[WS] Connecting to:", url)
    return url
  }

  private openSocket() {
    const url = this.getUrl()
    if (!url) {
      console.warn("[WS] Cannot connect: missing token or boardId")
      setTimeout(() => this.reconnect(), this.reconnectTimeout)
      return
    }

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log(`[WS] Connected to board: ${this.boardId}`)
      this.reconnectTimeout = 1000 // сбрасываем таймаут после успешного подключения
    }

    this.ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data)
        console.log("[WS] Received message:", data.type)

        switch (data.type) {
          case "CREATE_TASK":
            if (data.task) {
              store.dispatch(addTaskFromWS(data.task))
            }
            break

          case "MOVE_TASK":
            if (data.taskId && data.newStatus) {
              store.dispatch(moveTask({
                taskId: data.taskId,
                newStatus: data.newStatus,
                boardId: data.boardId || this.boardId!,
              }))
            }
            break

          case "DELETE_TASK":
            if (data.taskId) {
              store.dispatch(deleteTask(data.taskId))
            }
            break

          case "UPDATE_TASK":
            if (data.task) {
              store.dispatch(updateTask(data.task))
            }
            break

          default:
            console.log("[WS] Unknown message type:", (data as any).type)
        }

        this.listeners.forEach(fn => fn(data))
      } catch (err) {
        console.error("[WS] Failed to parse message:", err, event.data)
      }
    }

    this.ws.onclose = (event) => {
      console.log(`[WS] Disconnected from board ${this.boardId} (code: ${event.code}, reason: ${event.reason})`)
      this.reconnect()
    }

    this.ws.onerror = (event) => {
      console.error("[WS] WebSocket error:", event)
      this.ws?.close()
    }
  }

  private reconnect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    console.log(`[WS] Reconnecting in ${this.reconnectTimeout}ms...`)
    setTimeout(() => this.openSocket(), this.reconnectTimeout)

    this.reconnectTimeout = Math.min(this.reconnectTimeout * 2, this.maxReconnectTimeout)
  }

  send(data: WSMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WS] Not connected, cannot send:", data)
      return
    }

    try {
      this.ws.send(JSON.stringify(data))
      console.log("[WS] Sent:", data.type)
    } catch (err) {
      console.error("[WS] Send failed:", err)
    }
  }

  subscribe(fn: (data: WSMessage) => void) {
    this.listeners.push(fn)
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn)
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const taskSocket = new TaskSocket()

// Для отладки в консоли браузера
if (typeof window !== "undefined") {
  // @ts-ignore
  window.taskSocket = taskSocket
}