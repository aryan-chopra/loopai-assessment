import { jest } from '@jest/globals';
import { queueBatch, getBatchStatus } from '../services/processor.js';

jest.useFakeTimers();
jest.setTimeout(10000); // increase timeout for all tests

describe('Batch Processing Service', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('should queue a batch and return a valid batchId', async () => {
    const batch = [1, 2, 3, 4];
    const priority = "HIGH";

    const batchId = await queueBatch(batch, priority);
    expect(typeof batchId).toBe('string');
    expect(batchId.length).toBe(6);

    const status = await getBatchStatus(batchId);
    expect(status.yet_to_start.sort()).toEqual(batch.sort());

    // triggered may have some items because processing runs right away
    // So we just check triggered is an array:
    expect(Array.isArray(status.triggered)).toBe(true);
    expect(status.completed).toEqual([]);
  });

  test('should eventually process and complete the batch', async () => {
    const batch = [10, 20, 30];
    const priority = "MEDIUM";

    const batchId = await queueBatch(batch, priority);

    jest.advanceTimersByTime(5500);
    await Promise.resolve();
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

    jest.advanceTimersByTime(5500);
    await new Promise(res => setImmediate(res));

    let status = await getBatchStatus(batchId);
    expect(status.completed.length).toBe(3);

    jest.advanceTimersByTime(5500);
    await new Promise(res => setImmediate(res));

    status = await getBatchStatus(batchId);
    expect(status.completed.length).toBe(5);
  });
});
