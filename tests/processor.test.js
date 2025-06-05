import { queueBatch, process, getBatchStatus } from '../services/processor.js'
import { ingest } from '../controllers/ingest.js'
import { status } from '../controllers/status.js'
import { StatusCodes } from 'http-status-codes'
import jest from "jest"

// We will mock nanoid for consistent batch ids in tests
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'batch01')
}))

jest.useFakeTimers()

describe('Batch Processing Service', () => {
  beforeEach(() => {
    // Clear any queues and batch maps before each test
    // Unfortunately idBatchMap and idQueue are not exported, so tests may share state
    // You might want to export a reset function from your service for clean testing
  })

  test('queueBatch returns batch ID and queues items', async () => {
    const batch = [1, 2, 3, 4]
    const priority = 'HIGH'

    const batchID = await queueBatch(batch, priority)

    expect(batchID).toBe('batch01')

    const batchStatus = await getBatchStatus(batchID)
    expect(batchStatus.batch_size).toBe(batch.length)
    expect(batchStatus.yet_to_start).toEqual(batch)
    expect(batchStatus.triggered).toEqual([])
    expect(batchStatus.completed).toEqual([])
  })

  test('process handles queued items and updates statuses', async () => {
    const batch = [10, 20, 30, 40]
    const priority = 'HIGH'

    const batchID = await queueBatch(batch, priority)

    // Run processing in the background
    const processingPromise = process()

    // Fast-forward timers (simulate waiting in process)
    // It processes 3 items at a time, waits 5 seconds (5000ms), then marks completed
    jest.advanceTimersByTime(5000)

    await processingPromise

    const batchStatus = await getBatchStatus(batchID)

    // After processing, first 3 should be completed, last one not yet started (since only 3 processed per cycle)
    expect(batchStatus.completed).toEqual(expect.arrayContaining([10, 20, 30]))
    expect(batchStatus.yet_to_start).toEqual(expect.arrayContaining([40]))
    expect(batchStatus.triggered).toEqual([])
  })
})

describe('Ingest and Status Controllers', () => {
  test('ingest endpoint returns ingestion_id', async () => {
    const req = {
      body: {
        ids: [5, 6, 7],
        priority: 'MEDIUM'
      }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    await ingest(req, res)

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ingestion_id: expect.any(String)
    }))
  })

  test('status endpoint returns correct batch status', async () => {
    // First queue batch
    const batch = [100, 200]
    const priority = 'LOW'
    const batchID = await queueBatch(batch, priority)

    const req = { params: { ingestion_id: batchID } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    // Before processing, status should be yet_to_start
    await status(req, res)
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
    expect(res.json).toMatchObject({
      ingestion_id: batchID,
      status: 'yet_to_start',
      batches: expect.arrayContaining([
        expect.objectContaining({ status: 'yet_to_start', ids: batch })
      ])
    })

    // Process the batch to update status
    const processingPromise = process()
    jest.advanceTimersByTime(5000)
    await processingPromise

    // Now status should show completed or triggered for first 3 (here only 2)
    await status(req, res)

    expect(res.json().status).toMatch(/(completed|triggered)/)
  })
})
