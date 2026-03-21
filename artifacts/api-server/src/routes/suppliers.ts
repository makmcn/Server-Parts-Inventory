import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { suppliersTable } from "@workspace/db/schema";
import { CreateSupplierBody, UpdateSupplierBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/suppliers", async (req, res) => {
  try {
    const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
    res.json(suppliers);
  } catch (err) {
    req.log.error({ err }, "Failed to list suppliers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/suppliers", async (req, res) => {
  try {
    const body = CreateSupplierBody.parse(req.body);
    const [supplier] = await db.insert(suppliersTable).values(body).returning();
    res.status(201).json(supplier);
  } catch (err) {
    req.log.error({ err }, "Failed to create supplier");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.put("/suppliers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateSupplierBody.parse(req.body);
    const [supplier] = await db.update(suppliersTable).set(body).where(eq(suppliersTable.id, id)).returning();
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    res.json(supplier);
  } catch (err) {
    req.log.error({ err }, "Failed to update supplier");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/suppliers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
