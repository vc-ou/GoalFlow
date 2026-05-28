export type TaskStatusFeedback = "todo" | "doing" | "done";

export function getTaskStatusToast(status: TaskStatusFeedback) {
  if (status === "done") {
    return "你离目标更近一步";
  }

  if (status === "doing") {
    return "已设为进行中";
  }

  return "已回到待办";
}

export function getTaskStatusPulse(status: TaskStatusFeedback) {
  if (status === "done") {
    return "done";
  }

  if (status === "doing") {
    return "doing";
  }

  return "todo";
}
