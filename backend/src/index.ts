import "dotenv/config";
import cors from "cors";
import express from "express";
import "./db";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import transactionsRoutes from "./routes/transactions";
import dashboardRoutes from "./routes/dashboard";
import { errorHandler } from "./middleware";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(errorHandler);

const port = Number(process.env.PORT || 4001);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
