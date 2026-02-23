import { createSlice } from "@reduxjs/toolkit";
import { TaskState, Task } from "./types";

const initialState: TaskState = {
  loading: false,
  error: null,
  components: {},
  ids: [],
};

export const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    addTaskFromWS: (state, action) => {
      const task = action.payload as Task;
      if (!task.boardId) return;                    // защита
      state.components[task.id] = task;
      if (!state.ids.includes(task.id)) {
        state.ids.push(task.id);
      }
    },

    moveTaskLocal(state, action) {
      const { taskId, newStatus, boardId } = action.payload;
      const task = state.components[taskId];
      if (!task || task.boardId !== boardId) return; // нельзя переместить чужую
      if (task.status === newStatus) return;
      task.status = newStatus;
    },

    moveTask: (state, action) => {
      const { taskId, newStatus, boardId } = action.payload;
      const task = state.components[taskId];
      if (!task || task.boardId !== boardId) return;
      task.status = newStatus;
    },

    deleteTask: (state, action) => {
      const id = action.payload;
      if (!state.components[id]) return;
      delete state.components[id];
      state.ids = state.ids.filter((x) => x !== id);
    },

    updateTask: (state, action) => {
      const serverTask = action.payload as Task;
      const localTask = state.components[serverTask.id];
      if (!localTask) {
        state.components[serverTask.id] = serverTask;
        return;
      }
      Object.assign(localTask, serverTask);
    },
  },

});

export const { addTaskFromWS, moveTask, deleteTask, moveTaskLocal, updateTask } =
  taskSlice.actions;
export default taskSlice.reducer;