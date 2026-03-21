import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { partsTable } from "./parts";

export const transactionTypeEnum = ["receipt", "issue", "adjustment", "transfer"] as const;

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  partId: integer("part_id").notNull().references(() => partsTable.id),
  type: text("type", { enum: transactionTypeEnum }).notNull(),
  quantity: integer("quantity").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true, previousQuantity: true, newQuantity: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
