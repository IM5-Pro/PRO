/**
 * TodoList Component
 * Manages and displays employee tasks
 */

import React, { useState } from 'react';
import {
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiCircle,
} from 'react-icons/fi';
import { validateRequired } from '../../utils/validation';

/**
 * TodoList Component - Manage employee tasks
 * @returns {JSX.Element} - TodoList component
 */
const TodoList = () => {
  // State for todos
  const [todos, setTodos] = useState([
    {
      id: 1,
      title: 'Complete project report',
      dueDate: '2024-03-10',
      priority: 'high',
      completed: false,
    },
    {
      id: 2,
      title: 'Review team feedback',
      dueDate: '2024-03-08',
      priority: 'medium',
      completed: true,
    },
    {
      id: 3,
      title: 'Attend client meeting',
      dueDate: '2024-03-06',
      priority: 'high',
      completed: false,
    },
    {
      id: 4,
      title: 'Update documentation',
      dueDate: '2024-03-12',
      priority: 'low',
      completed: false,
    },
  ]);

  // State for new todo
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  /**
   * Add a new todo
   */
  const handleAddTodo = () => {
    if (!validateRequired(newTodo)) {
      alert('Please enter a task');
      return;
    }

    const todo = {
      id: Date.now(),
      title: newTodo,
      dueDate: new Date().toISOString().split('T')[0],
      priority: newPriority,
      completed: false,
    };

    setTodos([...todos, todo]);
    setNewTodo('');
    setNewPriority('medium');
  };

  /**
   * Toggle todo completion status
   * @param {number} id - Todo ID
   */
  const handleToggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  /**
   * Delete a todo
   * @param {number} id - Todo ID
   */
  const handleDeleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  /**
   * Get priority color
   * @param {string} priority - Priority level
   * @returns {string} - Tailwind color classes
   */
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || colors.medium;
  };

  /**
   * Check if due date is overdue
   * @param {string} dueDate - Due date string
   * @returns {boolean} - True if overdue
   */
  const isOverdue = (dueDate) => new Date(dueDate) < new Date();

  // Count completed todos
  const completedCount = todos.filter((t) => t.completed).length;
  const completionPercentage = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className="card w-full">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">My Tasks</h2>
        <span className="text-sm font-semibold text-gray-600">
          {completedCount} of {todos.length}
        </span>
      </div>

      {/* Progress Bar */}
      {todos.length > 0 && (
        <div className="mb-4">
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {Math.round(completionPercentage)}% Complete
          </p>
        </div>
      )}

      {/* Add New Todo */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            aria-label="New task input"
          />
          <button
            onClick={handleAddTodo}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-1"
            aria-label="Add task"
          >
            <FiPlus size={16} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          aria-label="Task priority"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>

      {/* Todo List */}
      {todos.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                todo.completed
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-300 hover:border-blue-400'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggleTodo(todo.id)}
                className="flex-shrink-0 mt-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                aria-label={`Toggle ${todo.title}`}
              >
                {todo.completed ? (
                  <FiCheckCircle className="text-green-600" size={20} />
                ) : (
                  <FiCircle size={20} />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    todo.completed
                      ? 'line-through text-gray-500'
                      : 'text-gray-800'
                  }`}
                >
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <FiCalendar className="text-gray-400" size={14} />
                  <span className={`text-xs ${
                    isOverdue(todo.dueDate) && !todo.completed
                      ? 'text-red-600 font-semibold'
                      : 'text-gray-500'
                  }`}>
                    {new Date(todo.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {isOverdue(todo.dueDate) && !todo.completed && (
                    <FiAlertCircle className="text-red-600" size={14} />
                  )}
                </div>
              </div>

              {/* Priority Badge */}
              <span className={`badge text-xs flex-shrink-0 ${getPriorityColor(todo.priority)}`}>
                {todo.priority}
              </span>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                aria-label="Delete task"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <FiCheckCircle className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">No tasks yet. Add one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default TodoList;
