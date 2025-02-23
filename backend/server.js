import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ticketRouter from "./routes/ticket.route.js"; // ✅ Ensure correct path

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", ticketRouter);

app.listen(5001, () => {
    console.log("Server is running at http://localhost:5001");
});
