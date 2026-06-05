import { http } from "./http";
import type { ApiTask } from "./types";

export function createTask(payload: Record<string, unknown>) {
  return http<ApiTask>("/tasks", {
    method: "POST",
    data: payload
  });
}

export function fetchTask(taskId: string) {
  return http<ApiTask>(`/tasks/${taskId}`);
}

export function updateTask(taskId: string, payload: Record<string, unknown>) {
  return http<ApiTask>(`/tasks/${taskId}`, {
    method: "PUT",
    data: payload
  });
}

export function updateTaskStatus(taskId: string, status: string) {
  return http<ApiTask>(`/tasks/${taskId}/status`, {
    method: "POST",
    data: { status }
  });
}

export function deleteTask(taskId: string) {
  return http<{ success: boolean }>(`/tasks/${taskId}`, {
    method: "DELETE"
  });
}
