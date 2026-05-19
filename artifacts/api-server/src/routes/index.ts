import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subjectsRouter from "./subjects";
import tasksRouter from "./tasks";
import sessionsRouter from "./sessions";
import statsRouter from "./stats";
import authRouter from "./auth";
import passwordsRouter from "./passwords";
import aiRouter from "./ai";
import icalRouter from "./ical";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(subjectsRouter);
router.use(tasksRouter);
router.use(sessionsRouter);
router.use(statsRouter);
router.use(passwordsRouter);
router.use(aiRouter);
router.use(icalRouter);

export default router;
