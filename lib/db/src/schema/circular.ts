import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const itemsTable = pgTable("circular_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  condition: text("condition").notNull(),
  city: text("city").notNull(),
  notes: text("notes"),
  recommendation: text("recommendation").notNull(),
  recommendationReason: text("recommendation_reason").notNull(),
  status: text("status").notNull().default("submitted"),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rewardsTable = pgTable("circular_rewards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  points: integer("points").notNull(),
  status: text("status").notNull().default("earned"),
  date: text("date").notNull(),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({
  id: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewardsTable).omit({
  id: true,
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
export type Reward = typeof rewardsTable.$inferSelect;