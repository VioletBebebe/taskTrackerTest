import { createAsyncThunk } from "@reduxjs/toolkit";
import { Task } from "./types";

export const createTask = createAsyncThunk(
  "create/task",
  async ({ task }: { task: Task }) => {
    const res = await fetch("http://localhost:3000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task }),
      credentials: "include",
    });

    if (!res.ok) throw new Error("Unlucky");
    console.log({ task })
    return { task };
  }
);  

export const deleteTask = createAsyncThunk(
  "delete/task",
  async ( id: string ) => {
    const res = await fetch("http", {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Unlucky");

    return id;
  }
); 