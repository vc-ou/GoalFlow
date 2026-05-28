import { http } from "./http";

export interface TomorrowTodoItem {
  id?: string;
  _id?: string;
  content: string;
  status: string;
  target_date: string;
  sort_order: number;
}

export function fetchTomorrowTodos() {
  return http<TomorrowTodoItem[]>("/tomorrow-todos");
}

export function createTomorrowTodo(content: string) {
  return http<TomorrowTodoItem>("/tomorrow-todos", {
    method: "POST",
    data: { content }
  });
}

export function updateTomorrowTodo(id: string, payload: Record<string, unknown>) {
  return http<TomorrowTodoItem>(`/tomorrow-todos/${id}`, {
    method: "PUT",
    data: payload
  });
}

export function reorderTomorrowTodos(items: { id: string; sort_order: number }[]) {
  return http<{ success: true }>("/tomorrow-todos/reorder", {
    method: "PATCH",
    data: { items }
  });
}

export function deleteTomorrowTodo(id: string) {
  return http<{ success: true }>(`/tomorrow-todos/${id}`, {
    method: "DELETE"
  });
}
