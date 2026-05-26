/**
 * Swarm Event Bus Tests
 * Tests concurrent pub/sub event logistics on local SQLite bus.
 */

describe('Agent Event Bus', () => {
  let eventBus;

  beforeEach(() => {
    const busPath = require.resolve('../../bin/event_bus.js');
    delete require.cache[busPath];
    eventBus = require('../../bin/event_bus.js');
  });

  test('publish adds a structured event to agent_events table', () => {
    const payload = { file: 'src/main.ts', action: 'add_node' };
    const eventId = eventBus.publish('task_requested', 'be-agent', payload);
    expect(eventId).toBeGreaterThan(0);

    const list = eventBus.listEvents('task_requested');
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].sender).toBe('be-agent');
    expect(list[0].payload.file).toBe('src/main.ts');
  });

  test('subscribe processes pending events and updates status to completed', () => {
    const payload = { schema: 'users', changes: 'add_column_role' };
    eventBus.publish('schema_update', 'architect', payload);

    let called = false;
    let receivedPayload = null;

    const count = eventBus.subscribe('schema_update', (data, sender) => {
      called = true;
      receivedPayload = data;
      expect(sender).toBe('architect');
    });

    expect(count).toBe(1);
    expect(called).toBe(true);
    expect(receivedPayload.schema).toBe('users');

    // Event should be completed
    const events = eventBus.listEvents('schema_update');
    expect(events[0].status).toBe('completed');
  });

  test('subscribe marks event failed if callback handler throws error', () => {
    eventBus.publish('faulty_topic', 'fe-agent', { test: true });

    const count = eventBus.subscribe('faulty_topic', () => {
      throw new Error('Simulation of callback crash');
    });

    expect(count).toBe(0);

    // Event status should be failed
    const events = eventBus.listEvents('faulty_topic');
    expect(events[0].status).toBe('failed');
  });

  test('prunes history deletes completed and failed events from queue log table', () => {
    // Generate some history
    eventBus.publish('prunable', 'be-agent', { a: 1 });
    eventBus.subscribe('prunable', () => {}); // complete it

    eventBus.publish('prunable', 'be-agent', { a: 2 });
    try {
      eventBus.subscribe('prunable', () => { throw new Error('fail'); });
    } catch (e) {} // fail it

    const prunedCount = eventBus.clearHistory();
    expect(prunedCount).toBeGreaterThanOrEqual(2);

    const events = eventBus.listEvents('prunable');
    expect(events.length).toBe(0);
  });
});
