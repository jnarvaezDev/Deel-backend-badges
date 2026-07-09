import { Router } from "express";
import { getGeoController } from "../controllers/geo.controller";

const router = Router();

router.get("/geo", getGeoController);

export default router;
