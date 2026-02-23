import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { Task } from "./types";

export const selectTasksByBoardId = createSelector(
  [
    (state: RootState) => state.tasks.components,
    (_: RootState, boardId: string) => boardId,
  ],
  (components, boardId): Task[] =>
    Object.values(components)
      .filter((task) => task.boardId === boardId)
      .sort((a, b) => {
        // 1. Основная сортировка — по приоритету (high → medium → low)
        const priorityOrder = {
          high: 1,
          medium: 2,
          low: 3,
        };

        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;

        if (aPriority !== bPriority) {
          return aPriority - bPriority; // high (1) → medium (2) → low (3)
        }

        // 2. Если приоритет одинаковый — по дате создания (новые сверху)
        const dateA = new Date(b.createdAt).getTime();
        const dateB = new Date(a.createdAt).getTime();

        return dateB - dateA; // более новая дата (больше timestamp) → выше
        // если хочешь старые сверху → return dateA - dateB;
      })
);
export const selectTasksByBoardAndStatus = createSelector(
  [
    selectTasksByBoardId,
    (_: RootState, boardId: string, status: string) => status,
  ],
  (tasks, status) => tasks.filter((task) => task.status === status)
);