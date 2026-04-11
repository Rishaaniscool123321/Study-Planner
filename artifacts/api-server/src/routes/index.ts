import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subjectsRouter from "./subjects";
import tasksRouter from "./tasks";
import sessionsRouter from "./sessions";
import statsRouter from "./stats";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(subjectsRouter);
router.use(tasksRouter);
router.use(sessionsRouter);
router.use(statsRouter);

export default router;
