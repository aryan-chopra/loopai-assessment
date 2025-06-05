import { StatusCodes } from "http-status-codes"
import { getBatchStatus, queueBatch } from "../services/processor.js"

export const ingest = async (req, res) => {
    try {
        const ids = req.body.ids
        const priority = req.body.priority

        const batchId = await queueBatch(ids, priority)

        res.status(StatusCodes.OK).json({ ingestion_id: batchId })
    } catch (e) {
        throw new Error(e)
    }
}
