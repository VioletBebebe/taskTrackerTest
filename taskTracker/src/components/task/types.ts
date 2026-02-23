export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: number;
  userName: string;
  userId: string;
  boardId: string;           // теперь обязательно!
}


export interface TaskState {
  components: Record<string, Task>;
  ids: string[];
  loading: boolean;
  error: null | string | undefined;
}