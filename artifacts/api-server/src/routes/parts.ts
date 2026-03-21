import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { partsTable, categoriesTable, suppliersTable, warehousesTable } from "@workspace/db/schema";
import { CreatePartBody, UpdatePartBody, ListPartsQueryParams } from "@workspace/api-zod";
import { eq, like, and, lte, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/parts", async (req, res) => {
  try {
    const query = ListPartsQueryParams.parse(req.query);

    const conditions = [];
    if (query.search) {
      const search = `%${query.search}%`;
      conditions.push(
        sql`(${partsTable.name} ILIKE ${search} OR ${partsTable.partNumber} ILIKE ${search} OR ${partsTable.description} ILIKE ${search})`
      );
    }
    if (query.categoryId) conditions.push(eq(partsTable.categoryId, query.categoryId));
    if (query.supplierId) conditions.push(eq(partsTable.supplierId, query.supplierId));
    if (query.lowStock) conditions.push(lte(partsTable.quantity, partsTable.minQuantity));

    const parts = await db
      .select({
        id: partsTable.id,
        partNumber: partsTable.partNumber,
        name: partsTable.name,
        description: partsTable.description,
        categoryId: partsTable.categoryId,
        categoryName: categoriesTable.name,
        supplierId: partsTable.supplierId,
        supplierName: suppliersTable.name,
        warehouseId: partsTable.warehouseId,
        warehouseName: warehousesTable.name,
        quantity: partsTable.quantity,
        minQuantity: partsTable.minQuantity,
        unitPrice: partsTable.unitPrice,
        unit: partsTable.unit,
        compatibleModels: partsTable.compatibleModels,
        notes: partsTable.notes,
        createdAt: partsTable.createdAt,
        updatedAt: partsTable.updatedAt,
      })
      .from(partsTable)
      .leftJoin(categoriesTable, eq(partsTable.categoryId, categoriesTable.id))
      .leftJoin(suppliersTable, eq(partsTable.supplierId, suppliersTable.id))
      .leftJoin(warehousesTable, eq(partsTable.warehouseId, warehousesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(partsTable.name);

    const mapped = parts.map((p) => ({
      ...p,
      unitPrice: p.unitPrice !== null ? parseFloat(p.unitPrice as unknown as string) : null,
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list parts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/parts", async (req, res) => {
  try {
    const body = CreatePartBody.parse(req.body);
    const [part] = await db.insert(partsTable).values(body).returning();
    res.status(201).json({ ...part, unitPrice: part.unitPrice !== null ? parseFloat(part.unitPrice as unknown as string) : null });
  } catch (err: any) {
    req.log.error({ err }, "Failed to create part");
    if (err?.code === "23505") {
      return res.status(400).json({ error: "Part number already exists" });
    }
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/parts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [part] = await db
      .select({
        id: partsTable.id,
        partNumber: partsTable.partNumber,
        name: partsTable.name,
        description: partsTable.description,
        categoryId: partsTable.categoryId,
        categoryName: categoriesTable.name,
        supplierId: partsTable.supplierId,
        supplierName: suppliersTable.name,
        warehouseId: partsTable.warehouseId,
        warehouseName: warehousesTable.name,
        quantity: partsTable.quantity,
        minQuantity: partsTable.minQuantity,
        unitPrice: partsTable.unitPrice,
        unit: partsTable.unit,
        compatibleModels: partsTable.compatibleModels,
        notes: partsTable.notes,
        createdAt: partsTable.createdAt,
        updatedAt: partsTable.updatedAt,
      })
      .from(partsTable)
      .leftJoin(categoriesTable, eq(partsTable.categoryId, categoriesTable.id))
      .leftJoin(suppliersTable, eq(partsTable.supplierId, suppliersTable.id))
      .leftJoin(warehousesTable, eq(partsTable.warehouseId, warehousesTable.id))
      .where(eq(partsTable.id, id));

    if (!part) return res.status(404).json({ error: "Part not found" });
    res.json({ ...part, unitPrice: part.unitPrice !== null ? parseFloat(part.unitPrice as unknown as string) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to get part");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/parts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdatePartBody.parse(req.body);
    const [part] = await db.update(partsTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(partsTable.id, id))
      .returning();
    if (!part) return res.status(404).json({ error: "Part not found" });
    res.json({ ...part, unitPrice: part.unitPrice !== null ? parseFloat(part.unitPrice as unknown as string) : null });
  } catch (err) {
    req.log.error({ err }, "Failed to update part");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/parts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(partsTable).where(eq(partsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete part");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
