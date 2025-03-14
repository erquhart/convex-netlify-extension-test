import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  taskLists: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    dueDate: v.optional(v.number()),
    listId: v.id("taskLists"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_list", ["listId"]),
});
