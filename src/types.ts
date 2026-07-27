export interface Task {
  id: string;
  text: string;
  reminderTime?: string; // Format: 'HH:mm'
  isCompleted: boolean;
  notified?: boolean;
}

export interface Category {
  id: string;
  title: string;
  tasks: Task[];
}
