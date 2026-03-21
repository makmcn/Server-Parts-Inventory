import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { warehousesTable } from "@workspace/db/schema";
import { CreateWarehouseBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/warehouses", async (req, res) => {
  try {
    const warehouses = await db.select().from(warehousesTable).orderBy(warehousesTable.name);
    res.json(warehouses);
  } catch (err) {
    req.log.error({ err }, "Failed to list warehouses");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/warehouses", async (req, res) => {
  try {
    const body = CreateWarehouseBody.parse(req.body);
    const [warehouse] = await db.insert(warehousesTable).values(body).returning();
    res.status(201).json(warehouse);
  } catch (err) {
    req.log.error({ err }, "Failed to create warehouse");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/warehouses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(warehousesTable).where(eq(warehousesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete warehouse");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
