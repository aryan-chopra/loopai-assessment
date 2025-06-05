import { jest } from '@jest/globals';
import { queueBatch, getBatchStatus } from '../services/processor.js';

jest.useFakeTimers();
jest.setTimeout(30000);

describe('Batch Processing Service', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  test('should eventually process and complete the batch', async () => {
    const batch = [10, 20, 30];
    const priority = "MEDIUM";

    const batchId = await queueBatch(batch, priority);

    // wait for processing delay (one chunk of 3)
    jest.advanceTimersByTime(5500);
    await new Promise(res => setImmediate(res));

    const status = await getBatchStatus(batchId);
    expect(status.yet_to_start).toEqual([]);
    expect(status.triggered).toEqual([]);
    expect(status.completed.sort()).toEqual(batch.sort());
  });

  test('should process in chunks of 3 if batch is larger', async () => {
    const batch = [101, 102, 103, 104, 105];
    const priority = "LOW";

    const batchId = await queueBatch(batch, priority);

    // First chunk processed (3 items)
    jest.advanceTimersByTime(5500);
    await new Promise(res => setImmediate(res));

    let status = await getBatchStatus(batchId);
    expect(status.completed.length).toBe(3);

    // Second chunk processed (2 remaining)
    jest.advanceTimersByTime(5500);
    await new Promise(res => setImmediate(res));

    status = await getBatchStatus(batchId);
    expect(status.completed.length).toBe(5);
  });
});
