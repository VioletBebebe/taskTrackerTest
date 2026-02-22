import { RootState } from "../../app/store"
import { createSelector } from "@reduxjs/toolkit"
export const selectAllTasks = (state: RootState) =>
  state.tasks.ids.map(id => state.tasks.components[id])



export const selectTasksByStatus = createSelector(
  [
    (state: RootState) => state.tasks.ids,
    (state: RootState) => state.tasks.components,
    (_: RootState, status: string) => status,
  ],
  (ids, components, status) =>
    ids
      .map(id => components[id])
      .filter(task => task?.status === status)   // добавь ? на всякий случай
      .sort((a, b) => a.createdAt - b.createdAt) // сортировка здесь!
);

