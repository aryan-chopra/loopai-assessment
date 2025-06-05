import express from "express"
import dotenv from "dotenv"
import { StatusCodes } from "http-status-codes"
import { ingest } from "./controllers/ingest.js"
import { status } from "./controllers/status.js"

dotenv.config()
const app = express()

const PORT = process.env.PORT || 3000;

app.use(express.json())

app.get('/status/:ingestion_id', status)
app.post('/ingest', ingest)

app.listen(PORT)
