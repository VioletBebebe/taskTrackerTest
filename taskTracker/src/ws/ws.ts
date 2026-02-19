import { store } from "../app/store"
import { addTaskFromWS } from "../components/task/taskSlice"
import { Task } from "../components/task/types"

class TaskSocket {
  private ws: WebSocket | null = null
  private url: string
  private reconnectTimeout = 1000
  private listeners: ((data: any) => void)[] = []

  constructor(url: string) {
    this.url = url
    this.connect()
  }

  private connect() {
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log("WS connected")
      this.reconnectTimeout = 1000
    }

    this.ws.onmessage = (event) => {
        const task: Task = JSON.parse(event.data)

        console.log("WS RECEIVED:", task)
        store.dispatch(addTaskFromWS(task))



      // if (data.event === "taskUpdated") store.dispatch(updateTaskFromWS(data.task))
      // if (data.event === "taskDeleted") store.dispatch(deleteTaskFromWS(data.id))


      this.listeners.forEach(fn => fn(task))
    }

    this.ws.onclose = () => {
      console.log("WS disconnected, reconnecting...")
      setTimeout(() => this.connect(), this.reconnectTimeout)
      this.reconnectTimeout = Math.min(this.reconnectTimeout * 2, 10000)
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WS NOT OPEN, message not sent:", data)
      return
    }

    this.ws.send(JSON.stringify(data))
  }

  subscribe(fn: (data: any) => void) {
    this.listeners.push(fn)
  }
}

export const taskSocket = new TaskSocket("ws://localhost:3000/ws")
if (typeof window !== "undefined") {
  // @ts-ignore
  window.taskSocket = taskSocket
}
