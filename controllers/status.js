import { StatusCodes } from "http-status-codes"
import { getBatchStatus } from "../services/processor.js"

export const status = async (req, res) => {
    try {
        const id = req.params.ingestion_id

        const statusObject = await getBatchStatus(id)
        let status

        if (statusObject.completed.length == statusObject.batch_size) {
            status = "completed"
        } else if (statusObject.triggered.length >= 1) {
            status = "triggered"
        } else {
            status = "yet_to_start"
        }

        let batches = []

        if (statusObject.completed.length > 0) {
            batches.push({
                "batch_id": id,
                "ids": statusObject.completed,
                "status": "completed"
            })
        }

        if (statusObject.triggered.length > 0) {
            batches.push({
                "batch_id": id,
                "ids": statusObject.triggered,
                "status": "triggered"
            })
        }

        if (statusObject.yet_to_start.length > 0) {
            batches.push({
                "batch_id": id,
                "ids": statusObject.yet_to_start,
                "status": "yet_to_start"
            })
        }

        res.status(StatusCodes.OK).json({
            "ingestion_id": id,
            "status": status,
            "batches": batches
        })
    } catch (e) {
        throw new Error(e)
    }
}