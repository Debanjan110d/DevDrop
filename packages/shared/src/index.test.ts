import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isValidTransition, SOCKET_EVENTS } from './index.js';

describe('Transfer State Machine', () => {
  test('validates standard successful progression', () => {
    assert.equal(isValidTransition('pending', 'uploading'), true);
    assert.equal(isValidTransition('uploading', 'available'), true);
    assert.equal(isValidTransition('available', 'downloading'), true);
    assert.equal(isValidTransition('downloading', 'completed'), true);
  });

  test('validates cancellation from cancellable states', () => {
    assert.equal(isValidTransition('pending', 'cancelled'), true);
    assert.equal(isValidTransition('uploading', 'cancelled'), true);
    assert.equal(isValidTransition('available', 'cancelled'), true);
    assert.equal(isValidTransition('downloading', 'cancelled'), true);
  });

  test('rejects illegal status jumps', () => {
    assert.equal(isValidTransition('pending', 'completed'), false);
    assert.equal(isValidTransition('completed', 'uploading'), false);
    assert.equal(isValidTransition('failed', 'available'), false);
    assert.equal(isValidTransition('cancelled', 'pending'), false);
  });

  test('exports required Socket.IO event names', () => {
    assert.ok(SOCKET_EVENTS.SERVER_STATUS);
    assert.ok(SOCKET_EVENTS.TRANSFER_CREATED);
    assert.ok(SOCKET_EVENTS.TRANSFER_AVAILABLE);
    assert.ok(SOCKET_EVENTS.TRANSFER_PROGRESS);
    assert.ok(SOCKET_EVENTS.TRANSFER_COMPLETED);
    assert.ok(SOCKET_EVENTS.DEVICE_PAIRED);
  });
});

