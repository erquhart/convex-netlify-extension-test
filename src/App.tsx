"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect, useRef } from "react";

function App() {
  const [newListName, setNewListName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | undefined>();
  const [editingListId, setEditingListId] = useState<string | undefined>();
  const [editingListName, setEditingListName] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();
  const [editingTask, setEditingTask] = useState<{
    title: string;
    description: string;
    dueDate: string;
  }>({ title: "", description: "", dueDate: "" });
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  const taskLists = useQuery(api.myFunctions.getTaskLists);
  const tasks = useQuery(
    api.myFunctions.getTasks,
    selectedListId ? { listId: selectedListId as any } : "skip",
  );

  const createList = useMutation(api.myFunctions.createTaskList);
  const updateList = useMutation(api.myFunctions.updateTaskList);
  const deleteList = useMutation(api.myFunctions.deleteTaskList);
  const createTask = useMutation(api.myFunctions.createTask);
  const updateTask = useMutation(api.myFunctions.updateTask);
  const deleteTask = useMutation(api.myFunctions.deleteTask);

  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("all");

  const organizedTasks = tasks?.reduce(
    (acc, task) => {
      if (!task.dueDate) {
        acc.noDueDate.push(task);
        return acc;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      if (dueDate < today) {
        acc.overdue.push(task);
      } else if (dueDate.getTime() === today.getTime()) {
        acc.today.push(task);
      } else if (dueDate < nextWeek) {
        acc.upcoming.push(task);
      } else {
        acc.later.push(task);
      }

      return acc;
    },
    {
      overdue: [],
      today: [],
      upcoming: [],
      later: [],
      noDueDate: [],
    } as Record<
      string,
      typeof tasks extends undefined ? [] : (typeof tasks)[number][]
    >,
  );

  useEffect(() => {
    if (!selectedListId && taskLists?.length) {
      setSelectedListId(taskLists[0]._id);
    }
  }, [taskLists, selectedListId]);

  useEffect(() => {
    if (selectedListId && newTaskInputRef.current) {
      newTaskInputRef.current.focus();
    }
  }, [selectedListId]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    const id = await createList({ name: newListName.trim() });
    setNewListName("");
    setSelectedListId(id as string);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !selectedListId) return;
    await createTask({
      listId: selectedListId as any,
      title: newTaskTitle.trim(),
    });
    setNewTaskTitle("");
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    await updateTask({ taskId: taskId as any, completed: !completed });
  };

  const handleStartEditList = (list: { _id: string; name: string }) => {
    setEditingListId(list._id);
    setEditingListName(list.name);
  };

  const handleSaveListEdit = async () => {
    if (!editingListId || !editingListName.trim()) return;
    await updateList({
      listId: editingListId as any,
      name: editingListName.trim(),
    });
    setEditingListId(undefined);
  };

  const handleStartEditTask = (task: {
    _id: string;
    title: string;
    description?: string;
    dueDate?: number;
  }) => {
    setEditingTaskId(task._id);
    setEditingTask({
      title: task.title,
      description: task.description ?? "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
    });
  };

  const handleSaveTaskEdit = async () => {
    if (!editingTaskId || !editingTask.title.trim()) return;
    await updateTask({
      taskId: editingTaskId as any,
      title: editingTask.title.trim(),
      description: editingTask.description || undefined,
      dueDate: editingTask.dueDate
        ? new Date(editingTask.dueDate).getTime()
        : undefined,
    });
    setEditingTaskId(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (newListName.trim()) {
        handleCreateList();
      } else if (newTaskTitle.trim() && selectedListId) {
        handleCreateTask();
      }
    }
  };

  const selectedList = taskLists?.find((list) => list._id === selectedListId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="bg-white border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Flow Tasks
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Task Lists
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="New list name"
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button
                    onClick={handleCreateList}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {taskLists?.map((list) => (
                  <div
                    key={list._id}
                    className={`group transition-colors ${
                      selectedListId === list._id
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {editingListId === list._id ? (
                      <div className="p-3">
                        <input
                          type="text"
                          value={editingListName}
                          onChange={(e) => setEditingListName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveListEdit()
                          }
                          className="w-full px-3 py-1.5 border-2 border-indigo-500 rounded-lg focus:outline-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3">
                        <button
                          onClick={() => setSelectedListId(list._id)}
                          className="flex-1 text-left font-medium text-gray-900"
                        >
                          {list.name}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEditList(list)}
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              deleteList({ listId: list._id as any })
                            }
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {selectedListId ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedList?.name}
                  </h2>
                  <div className="flex items-center gap-6">
                    <div className="flex rounded-lg border-2 border-indigo-100 p-1">
                      <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          filter === "all"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-600 hover:text-indigo-600"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilter("today")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          filter === "today"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-600 hover:text-indigo-600"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setFilter("upcoming")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          filter === "upcoming"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-600 hover:text-indigo-600"
                        }`}
                      >
                        Upcoming
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={newTaskInputRef}
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a new task"
                        className="w-80 px-4 py-2 bg-white border-2 border-indigo-100 rounded-xl placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        onClick={handleCreateTask}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {organizedTasks?.overdue.length ? (
                    <section>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600 mb-3">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Overdue
                      </h3>
                      <div className="space-y-3">
                        {organizedTasks.overdue.map((task) => (
                          <div
                            key={task._id}
                            className={`group bg-white border-2 ${
                              task.completed
                                ? "border-green-100"
                                : "border-indigo-100"
                            } rounded-xl p-4 hover:border-indigo-500 transition-colors`}
                          >
                            {editingTaskId === task._id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingTask.title}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      title: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleSaveTaskEdit()
                                  }
                                  className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none"
                                  autoFocus
                                />
                                <textarea
                                  value={editingTask.description}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Add a description..."
                                  rows={2}
                                  className="w-full px-3 py-2 border-2 border-indigo-100 rounded-lg placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <input
                                      type="date"
                                      value={editingTask.dueDate}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          dueDate: e.target.value,
                                        })
                                      }
                                      className="px-3 py-1.5 border-2 border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleSaveTaskEdit}
                                      className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingTaskId(undefined)
                                      }
                                      className="px-4 py-1.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-4">
                                <div className="pt-0.5">
                                  <button
                                    onClick={() =>
                                      handleToggleTask(task._id, task.completed)
                                    }
                                    className={`w-5 h-5 rounded-full border-2 ${
                                      task.completed
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 hover:border-indigo-500"
                                    } transition-colors`}
                                  >
                                    {task.completed && (
                                      <svg
                                        className="w-full h-full text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className={`text-lg font-medium ${
                                      task.completed
                                        ? "text-green-500 line-through"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.dueDate && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      {new Date(
                                        task.dueDate,
                                      ).toLocaleDateString(undefined, {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleStartEditTask(task)}
                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteTask({ taskId: task._id as any })
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {(filter === "all" || filter === "today") &&
                  organizedTasks?.today.length ? (
                    <section>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-indigo-600 mb-3">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Today
                      </h3>
                      <div className="space-y-3">
                        {organizedTasks.today.map((task) => (
                          <div
                            key={task._id}
                            className={`group bg-white border-2 ${
                              task.completed
                                ? "border-green-100"
                                : "border-indigo-100"
                            } rounded-xl p-4 hover:border-indigo-500 transition-colors`}
                          >
                            {editingTaskId === task._id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingTask.title}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      title: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleSaveTaskEdit()
                                  }
                                  className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none"
                                  autoFocus
                                />
                                <textarea
                                  value={editingTask.description}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Add a description..."
                                  rows={2}
                                  className="w-full px-3 py-2 border-2 border-indigo-100 rounded-lg placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <input
                                      type="date"
                                      value={editingTask.dueDate}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          dueDate: e.target.value,
                                        })
                                      }
                                      className="px-3 py-1.5 border-2 border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleSaveTaskEdit}
                                      className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingTaskId(undefined)
                                      }
                                      className="px-4 py-1.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-4">
                                <div className="pt-0.5">
                                  <button
                                    onClick={() =>
                                      handleToggleTask(task._id, task.completed)
                                    }
                                    className={`w-5 h-5 rounded-full border-2 ${
                                      task.completed
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 hover:border-indigo-500"
                                    } transition-colors`}
                                  >
                                    {task.completed && (
                                      <svg
                                        className="w-full h-full text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className={`text-lg font-medium ${
                                      task.completed
                                        ? "text-green-500 line-through"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.dueDate && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      {new Date(
                                        task.dueDate,
                                      ).toLocaleDateString(undefined, {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleStartEditTask(task)}
                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteTask({ taskId: task._id as any })
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {(filter === "all" || filter === "upcoming") &&
                  organizedTasks?.upcoming.length ? (
                    <section>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-600 mb-3">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        This Week
                      </h3>
                      <div className="space-y-3">
                        {organizedTasks.upcoming.map((task) => (
                          <div
                            key={task._id}
                            className={`group bg-white border-2 ${
                              task.completed
                                ? "border-green-100"
                                : "border-indigo-100"
                            } rounded-xl p-4 hover:border-indigo-500 transition-colors`}
                          >
                            {editingTaskId === task._id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingTask.title}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      title: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleSaveTaskEdit()
                                  }
                                  className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none"
                                  autoFocus
                                />
                                <textarea
                                  value={editingTask.description}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Add a description..."
                                  rows={2}
                                  className="w-full px-3 py-2 border-2 border-indigo-100 rounded-lg placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <input
                                      type="date"
                                      value={editingTask.dueDate}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          dueDate: e.target.value,
                                        })
                                      }
                                      className="px-3 py-1.5 border-2 border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleSaveTaskEdit}
                                      className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingTaskId(undefined)
                                      }
                                      className="px-4 py-1.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-4">
                                <div className="pt-0.5">
                                  <button
                                    onClick={() =>
                                      handleToggleTask(task._id, task.completed)
                                    }
                                    className={`w-5 h-5 rounded-full border-2 ${
                                      task.completed
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 hover:border-indigo-500"
                                    } transition-colors`}
                                  >
                                    {task.completed && (
                                      <svg
                                        className="w-full h-full text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className={`text-lg font-medium ${
                                      task.completed
                                        ? "text-green-500 line-through"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.dueDate && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      {new Date(
                                        task.dueDate,
                                      ).toLocaleDateString(undefined, {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleStartEditTask(task)}
                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteTask({ taskId: task._id as any })
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {filter === "all" && organizedTasks?.later.length ? (
                    <section>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-600 mb-3">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                        Later
                      </h3>
                      <div className="space-y-3">
                        {organizedTasks.later.map((task) => (
                          <div
                            key={task._id}
                            className={`group bg-white border-2 ${
                              task.completed
                                ? "border-green-100"
                                : "border-indigo-100"
                            } rounded-xl p-4 hover:border-indigo-500 transition-colors`}
                          >
                            {editingTaskId === task._id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingTask.title}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      title: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleSaveTaskEdit()
                                  }
                                  className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none"
                                  autoFocus
                                />
                                <textarea
                                  value={editingTask.description}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Add a description..."
                                  rows={2}
                                  className="w-full px-3 py-2 border-2 border-indigo-100 rounded-lg placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <input
                                      type="date"
                                      value={editingTask.dueDate}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          dueDate: e.target.value,
                                        })
                                      }
                                      className="px-3 py-1.5 border-2 border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleSaveTaskEdit}
                                      className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingTaskId(undefined)
                                      }
                                      className="px-4 py-1.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-4">
                                <div className="pt-0.5">
                                  <button
                                    onClick={() =>
                                      handleToggleTask(task._id, task.completed)
                                    }
                                    className={`w-5 h-5 rounded-full border-2 ${
                                      task.completed
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 hover:border-indigo-500"
                                    } transition-colors`}
                                  >
                                    {task.completed && (
                                      <svg
                                        className="w-full h-full text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className={`text-lg font-medium ${
                                      task.completed
                                        ? "text-green-500 line-through"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.dueDate && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      {new Date(
                                        task.dueDate,
                                      ).toLocaleDateString(undefined, {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleStartEditTask(task)}
                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteTask({ taskId: task._id as any })
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {filter === "all" && organizedTasks?.noDueDate.length ? (
                    <section>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-600 mb-3">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                          />
                        </svg>
                        No Due Date
                      </h3>
                      <div className="space-y-3">
                        {organizedTasks.noDueDate.map((task) => (
                          <div
                            key={task._id}
                            className={`group bg-white border-2 ${
                              task.completed
                                ? "border-green-100"
                                : "border-indigo-100"
                            } rounded-xl p-4 hover:border-indigo-500 transition-colors`}
                          >
                            {editingTaskId === task._id ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingTask.title}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      title: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleSaveTaskEdit()
                                  }
                                  className="w-full px-3 py-2 border-2 border-indigo-500 rounded-lg focus:outline-none"
                                  autoFocus
                                />
                                <textarea
                                  value={editingTask.description}
                                  onChange={(e) =>
                                    setEditingTask({
                                      ...editingTask,
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Add a description..."
                                  rows={2}
                                  className="w-full px-3 py-2 border-2 border-indigo-100 rounded-lg placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                                />
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-5 h-5 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <input
                                      type="date"
                                      value={editingTask.dueDate}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          dueDate: e.target.value,
                                        })
                                      }
                                      className="px-3 py-1.5 border-2 border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleSaveTaskEdit}
                                      className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingTaskId(undefined)
                                      }
                                      className="px-4 py-1.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-4">
                                <div className="pt-0.5">
                                  <button
                                    onClick={() =>
                                      handleToggleTask(task._id, task.completed)
                                    }
                                    className={`w-5 h-5 rounded-full border-2 ${
                                      task.completed
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300 hover:border-indigo-500"
                                    } transition-colors`}
                                  >
                                    {task.completed && (
                                      <svg
                                        className="w-full h-full text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3
                                    className={`text-lg font-medium ${
                                      task.completed
                                        ? "text-green-500 line-through"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  {task.description && (
                                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.dueDate && (
                                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                      {new Date(
                                        task.dueDate,
                                      ).toLocaleDateString(undefined, {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleStartEditTask(task)}
                                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteTask({ taskId: task._id as any })
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {!tasks?.length && (
                    <div className="bg-white border-2 border-dashed border-indigo-200 rounded-xl p-12 text-center">
                      <svg
                        className="w-16 h-16 mx-auto text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        No tasks yet
                      </h3>
                      <p className="mt-1 text-gray-500">
                        Add your first task to get started
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white border-2 border-dashed border-indigo-200 rounded-xl p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No list selected
                </h3>
                <p className="mt-1 text-gray-500">
                  Select a task list from the sidebar or create a new one to get
                  started
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
export default App;
