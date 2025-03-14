import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getTaskLists = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("taskLists")
      .order("desc")
      .collect();
  },
});

export const getTasks = query({
  args: { listId: v.id("taskLists") },
  handler: async (ctx, { listId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();
  },
});

export const createTaskList = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const now = Date.now();
    return await ctx.db.insert("taskLists", {
      name,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTaskList = mutation({
  args: { listId: v.id("taskLists"), name: v.string() },
  handler: async (ctx, { listId, name }) => {
    const list = await ctx.db.get(listId);
    if (!list) throw new Error("Task list not found");

    return await ctx.db.patch(listId, {
      name,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTaskList = mutation({
  args: { listId: v.id("taskLists") },
  handler: async (ctx, { listId }) => {
    // First delete all tasks in the list
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();
    
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Then delete the list itself
    await ctx.db.delete(listId);
  },
});

export const createTask = mutation({
  args: {
    listId: v.id("taskLists"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, { listId, title, description, dueDate }) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      title,
      description,
      completed: false,
      dueDate,
      listId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, { taskId, ...updates }) => {
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found");

    return await ctx.db.patch(taskId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    await ctx.db.delete(taskId);
  },
}); 