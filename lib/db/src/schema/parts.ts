import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";
import { suppliersTable } from "./suppliers";
import { warehousesTable } from "./warehouses";

export const partsTable = pgTable("parts", {
  id: serial("id").primaryKey(),
  partNumber: text("part_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  warehouseId: integer("warehouse_id").references(() => warehousesTable.id),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").notNull().default(0),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
  unit: text("unit").notNull().default("шт"),
  compatibleModels: text("compatible_models"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPartSchema = createInsertSchema(partsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPart = z.infer<typeof insertPartSchema>;
export type Part = typeof partsTable.$inferSelect;
