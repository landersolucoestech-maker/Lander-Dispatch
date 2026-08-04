import { Router, type IRouter } from "express";
import storageRouter from "./storage";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import carriersRouter from "./carriers";
import brokersRouter from "./brokers";
import loadsRouter from "./loads";
import pdfImportRouter from "./pdf-import";
import crmRouter from "./crm";
import crmDriversRouter from "./crm-drivers";
import invoicesRouter from "./invoices";
import transactionsRouter from "./transactions";
import accountingRouter from "./accounting";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(carriersRouter);
router.use(brokersRouter);
router.use(pdfImportRouter);
router.use(loadsRouter);
router.use(crmRouter);
router.use(crmDriversRouter);
router.use(invoicesRouter);
router.use(transactionsRouter);
router.use(accountingRouter);
router.use(settingsRouter);
router.use(storageRouter);

export default router;
