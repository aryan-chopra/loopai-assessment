import { PriorityQueue } from "@datastructures-js/priority-queue"
import { nanoid } from "nanoid";

const idBatchMap = new Map()
const idQueue = new PriorityQueue((id, otherId) => {
    if (id.priority === otherId.priority) {
        console.log("Same priority")
        return id.value - otherId.value
    }
    else if (id.priority === "HIGH") {
        console.log("1 high")
        return 1;
    } else if (otherId.priority === "HIGH") {
        console.log("2 high")
        return -1;
    } else if (id.priority === "MEDIUM") {
        console.log("1 med")
        return 1;
    } else if (otherId.priority === "MEDIUM") {
        console.log("2 med")
        return -1;
    }

    return 0;
})
let processing = false

export async function process() {
    processing = true

    while (idQueue.size() > 0) {
        const IDsTriggered = []

        // Trigger batch processing
        console.log("Triggering")
        while (idQueue.size() > 0 && IDsTriggered.length < 3) {
            const idObject = idQueue.dequeue()
            //TODO: CHANGE STATUS OF ID

            console.log("Processing: " + idObject.value)
            const batchStatus = idBatchMap.get(idObject.batchID)

            batchStatus.yet_to_start.splice(
                batchStatus.yet_to_start.indexOf(idObject.value)
                , 1
            )

            batchStatus.triggered.push(idObject.value)

            idBatchMap.set(idObject.batchID, batchStatus)

            IDsTriggered.push({ value: idObject.value, batchID: idObject.batchID })
        }

        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("Completing")
        // Trigger batch completion
        IDsTriggered.forEach(triggeredIdObject => {
            let batchStatus = idBatchMap.get(triggeredIdObject.batchID)

            batchStatus.triggered.splice(
                batchStatus.triggered.indexOf(triggeredIdObject.value)
                , 1
            )

            batchStatus.completed.push(triggeredIdObject.value)

            idBatchMap.set(triggeredIdObject.batchID, batchStatus)
        })
    }

    processing = false
}

export async function queueBatch(batch, priority) {
    const batchID = nanoid(6)

    idBatchMap.set(batchID, {
        batch_size: batch.length,
        yet_to_start: batch,
        triggered: [],
        completed: []
    })

    batch.forEach(id => {
        idQueue.push({ batchID: batchID, value: id, priority: priority })
    });

    if (!processing) {
        process()
    }

    return batchID
}

export async function getBatchStatus(batchId) {
    return idBatchMap.get(batchId)
}
