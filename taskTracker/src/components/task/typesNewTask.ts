export interface NewTask {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: number;
  boardId: string;  
  userName: string,         // обязательно
}
