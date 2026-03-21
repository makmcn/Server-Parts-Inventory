import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable, partsTable } from "@workspace/db/schema";
import { CreateTransactionBody, ListTransactionsQueryParams } from "@workspace/api-zod";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/transactions", async (req, res) => {
  try {
    const query = ListTransactionsQueryParams.parse(req.query);

    const conditions = [];
    if (query.partId) conditions.push(eq(transactionsTable.partId, query.partId));
    if (query.type) conditions.push(eq(transactionsTable.type, query.type as any));

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    const transactions = await db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const mapped = transactions.map((t) => ({
      ...t,
      unitPrice: t.unitPrice !== null ? parseFloat(t.unitPrice as unknown as string) : null,
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list transactions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const body = CreateTransactionBody.parse(req.body);

    const [part] = await db.select().from(partsTable).where(eq(partsTable.id, body.partId));
    if (!part) return res.status(404).json({ error: "Part not found" });

    const previousQuantity = part.quantity;
    let newQuantity: number;

    if (body.type === "receipt") {
      newQuantity = previousQuantity + body.quantity;
    } else if (body.type === "issue") {
      newQuantity = previousQuantity - body.quantity;
      if (newQuantity < 0) return res.status(400).json({ error: "Insufficient stock" });
    } else if (body.type === "adjustment") {
      newQuantity = body.quantity;
    } else {
      newQuantity = previousQuantity - body.quantity;
      if (newQuantity < 0) return res.status(400).json({ error: "Insufficient stock for transfer" });
    }

    await db.update(partsTable)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(partsTable.id, body.partId));

    const [transaction] = await db.insert(transactionsTable).values({
      partId: body.partId,
      type: body.type,
      quantity: body.quantity,
      previousQuantity,
      newQuantity,
      unitPrice: body.unitPrice?.toString() as any,
      reference: body.reference,
      notes: body.notes,
    }).returning();

    res.status(201).json({
      ...transaction,
      unitPrice: transaction.unitPrice !== null ? parseFloat(transaction.unitPrice as unknown as string) : null,
      partName: part.name,
      partNumber: part.partNumber,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create transaction");
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
