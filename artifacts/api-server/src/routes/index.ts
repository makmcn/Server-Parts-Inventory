import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import suppliersRouter from "./suppliers";
import warehousesRouter from "./warehouses";
import partsRouter from "./parts";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(suppliersRouter);
router.use(warehousesRouter);
router.use(partsRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);

export default router;
