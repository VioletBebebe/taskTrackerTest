import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit"
import { TaskState } from "./types"
import { createTask, deleteTask } from "./taskThunk"

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
    moveTask: (state, action) => {
        const { taskId, newStatus } = action.payload;
        const task = state.components[taskId];
        if (!task) return;
        task.status = newStatus;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(createTask.fulfilled, (state, action) => {
        const task = action.payload.task
        state.components[task.id] = task
        state.ids.push(task.id)
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const id = action.payload
        delete state.components[id]
        state.ids = state.ids.filter(x => x !== id)
      })
  }
})


export const { addTaskFromWS, moveTask } = taskSlice.actions
export default taskSlice.reducer