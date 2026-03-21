import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { partsTable, transactionsTable, categoriesTable } from "@workspace/db/schema";
import { eq, lte, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [totalPartsRow] = await db.select({ count: sql<number>`count(*)` }).from(partsTable);
    const totalParts = Number(totalPartsRow?.count ?? 0);

    const [totalItemsRow] = await db.select({ total: sql<number>`coalesce(sum(quantity), 0)` }).from(partsTable);
    const totalItems = Number(totalItemsRow?.total ?? 0);

    const [lowStockRow] = await db.select({ count: sql<number>`count(*)` }).from(partsTable)
      .where(sql`quantity <= min_quantity AND quantity > 0`);
    const lowStockCount = Number(lowStockRow?.count ?? 0);

    const [outOfStockRow] = await db.select({ count: sql<number>`count(*)` }).from(partsTable)
      .where(eq(partsTable.quantity, 0));
    const outOfStockCount = Number(outOfStockRow?.count ?? 0);

    const [totalValueRow] = await db.select({
      total: sql<number>`coalesce(sum(quantity * unit_price), 0)`
    }).from(partsTable);
    const totalValue = parseFloat((totalValueRow?.total ?? 0).toString());

    const recentTransactionsRaw = await db
      .select({
        id: transactionsTable.id,
        partId: transactionsTable.partId,
        partName: partsTable.name,
        partNumber: partsTable.partNumber,
        type: transactionsTable.type,
        quantity: transactionsTable.quantity,
        previousQuantity: transactionsTable.previousQuantity,
        newQuantity: transactionsTable.newQuantity,
        unitPrice: transactionsTable.unitPrice,
        reference: transactionsTable.reference,
        notes: transactionsTable.notes,
        createdAt: transactionsTable.createdAt,
      })
      .from(transactionsTable)
      .leftJoin(partsTable, eq(transactionsTable.partId, partsTable.id))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(10);

    const recentTransactions = recentTransactionsRaw.map((t) => ({
      ...t,
      unitPrice: t.unitPrice !== null ? parseFloat(t.unitPrice as unknown as string) : null,
    }));

    const topCategories = await db
      .select({
        name: categoriesTable.name,
        count: sql<number>`count(${partsTable.id})`,
      })
      .from(categoriesTable)
      .leftJoin(partsTable, eq(partsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id, categoriesTable.name)
      .orderBy(sql`count(${partsTable.id}) DESC`)
      .limit(5);

    res.json({
      totalParts,
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalValue,
      recentTransactions,
      topCategories: topCategories.map((c) => ({ name: c.name, count: Number(c.count) })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
