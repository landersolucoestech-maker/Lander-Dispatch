import { Router, type IRouter } from "express";

import { requireAuthenticated } from "../middlewares/authMiddleware";
import accountingRouter from "./accounting";
import auditRouter from "./audit";
import authRouter from "./auth";
import brokersRouter from "./brokers";
import carriersRouter from "./carriers";
import crmDriversRouter from "./crm-drivers";
import crmRouter from "./crm";
import dashboardRouter from "./dashboard";
import documentsRouter from "./documents";
import healthRouter from "./health";
import invoicesRouter from "./invoices";
import loadsRouter from "./loads";
import pdfImportRouter from "./pdf-import";
import settingsRouter from "./settings";
import storageRouter from "./storage";
import transactionsRouter from "./transactions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuthenticated);
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
router.use(documentsRouter);
router.use(auditRouter);
router.use(storageRouter);

export default router;
