/**
 * api/taskApi.js
 *
 * All task-related API calls.
 * Auth cookies are sent automatically — no manual token handling needed.
 */

import api from './axios';

/**
 * Fetch all tasks for the logged-in user.
 * @param {{ status?: string, priority?: string }} filters - Optional query filters
 */
export const getTasks = (filters = {}) => {
  const params = {};
  if (filters.status)   params.status   = filters.status;
  if (filters.priority) params.priority = filters.priority;
  return api.get('/tasks/', { params });
};

/**
 * Fetch a single task by ID.
 * @param {string} taskId
 */
export const getTask = (taskId) => api.get(`/tasks/${taskId}/`);

/**
 * Create a new task.
 * @param {{ title, description, status, priority, due_date }} data
 */
export const createTask = (data) => api.post('/tasks/', data);

/**
 * Update an existing task (partial update supported).
 * @param {string} taskId
 * @param {{ title?, description?, status?, priority?, due_date? }} data
 */
export const updateTask = (taskId, data) => api.put(`/tasks/${taskId}/`, data);

/**
 * Delete a task permanently.
 * @param {string} taskId
 */
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}/`);

/**
 * Mark a task as completed.
 * @param {string} taskId
 */
export const completeTask = (taskId) => api.patch(`/tasks/${taskId}/complete/`);

/**
 * Fetch tasks grouped by date for the calendar view.
 * @param {number} year  - e.g. 2026
 * @param {number} month - e.g. 6
 */
export const getCalendarTasks = (year, month) =>
  api.get('/tasks/calendar/', { params: { year, month } });