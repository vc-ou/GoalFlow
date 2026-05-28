import { http } from "./http";

export function updateTaskStatusFromHome(taskId: string, status: string) {
  return http(`/tasks/${taskId}/status`, {
    method: "POST",
    data: { status }
  });
}
