import { useEffect } from 'react';
import { showNotification } from './notifications';

export function useTodoReminder(todos) {
  useEffect(() => {
    if (Notification.permission !== 'granted' || todos.length === 0) return;

    const pendingTodos = todos.filter(t => !t.completed);
    if (pendingTodos.length === 0) return;

    const interval = setInterval(() => {
      const randomTodo = pendingTodos[Math.floor(Math.random() * pendingTodos.length)];
      showNotification(
        `⚡ ${pendingTodos.length} task${pendingTodos.length > 1 ? 's' : ''} pending`,
        randomTodo.title
      );
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [todos]);
}