import { createSlice } from "@reduxjs/toolkit"
import { TaskState } from "./types"
import { loginUser, deleteUser } from "./taskThunk"

const initialState: TaskState = {
  loading: false,
  error: null,
  components: {},
  ids: []
}

export const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    addTaskFromWS: (state, action) => {
      const task = action.payload
      state.components[task.id] = task
      if (!state.ids.includes(task.id)) {
        state.ids.push(task.id)
      }
    }, 
    moveTaskLocal(state, action) {
      const { taskId, newStatus } = action.payload
      const task = state.components[taskId]

      if (!task) return
      if (task.status === newStatus) return

      task.status = newStatus
    }, 
    moveTask: (state, action) => {
        const { taskId, newStatus } = action.payload;
        const task = state.components[taskId];
        if (!task) return;
        task.status = newStatus;
    }, 
    deleteTask: (state, action) => {
      const id = action.payload
      if (!state.components[id]) return
      delete state.components[id]
    }, 
    updateTask: (state, action) => {
      const serverTask = action.payload
      const localTask = state.components[serverTask.id]

      if (!localTask) {
        state.components[serverTask.id] = serverTask
        return
      }

      if (
        localTask.status === serverTask.status &&
        localTask.title === serverTask.title &&
        localTask.description === serverTask.description &&
        localTask.priority === serverTask.priority &&
        localTask.createdAt === serverTask.createdAt &&
        localTask.userName === serverTask.user
      ) {
        return
      }
      state.components[serverTask.id] = serverTask

      if (serverTask.title !== undefined) localTask.title = serverTask.title
      if (serverTask.status !== undefined) localTask.status = serverTask.status
    }

  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        const task = action.payload.task
        state.components[task.id] = task
        state.ids.push(task.id)
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const id = action.payload
        delete state.components[id]
        state.ids = state.ids.filter(x => x !== id)
      })
  }
})


export const { addTaskFromWS, moveTask, deleteTask, moveTaskLocal, updateTask } = taskSlice.actions
export default taskSlice.reducer