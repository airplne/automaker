import { describe, it, expect, vi } from 'vitest';
import { createEventEmitter, type EventType } from '@/lib/events.js';

describe('events.ts', () => {
  describe('createEventEmitter', () => {
    it('should emit events to single subscriber', () => {
      const emitter = createEventEmitter();
      const callback = vi.fn();

      emitter.subscribe(callback);
      emitter.emit('agent:stream', { message: 'test' });

      expect(callback).toHaveBeenCalledOnce();
      expect(callback).toHaveBeenCalledWith('agent:stream', { message: 'test' });
    });

    it('should emit events to multiple subscribers', () => {
      const emitter = createEventEmitter();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      emitter.subscribe(callback1);
      emitter.subscribe(callback2);
      emitter.subscribe(callback3);
      emitter.emit('feature:started', { id: '123' });

      expect(callback1).toHaveBeenCalledOnce();
      expect(callback2).toHaveBeenCalledOnce();
      expect(callback3).toHaveBeenCalledOnce();
      expect(callback1).toHaveBeenCalledWith('feature:started', { id: '123' });
    });

    it('should support unsubscribe functionality', () => {
      const emitter = createEventEmitter();
      const callback = vi.fn();

      const unsubscribe = emitter.subscribe(callback);
      emitter.emit('agent:stream', { test: 1 });

      expect(callback).toHaveBeenCalledOnce();

      unsubscribe();
      emitter.emit('agent:stream', { test: 2 });

      expect(callback).toHaveBeenCalledOnce(); // Still called only once
    });

    it('should handle errors in subscribers without crashing', () => {
      const emitter = createEventEmitter();
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      const normalCallback = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      emitter.subscribe(errorCallback);
      emitter.subscribe(normalCallback);

      expect(() => {
        emitter.emit('feature:error', { error: 'test' });
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalledOnce();
      expect(normalCallback).toHaveBeenCalledOnce();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should emit different event types', () => {
      const emitter = createEventEmitter();
      const callback = vi.fn();

      emitter.subscribe(callback);

      const eventTypes: EventType[] = [
        'agent:stream',
        'auto-mode:started',
        'feature:completed',
        'project:analysis-progress',
      ];

      eventTypes.forEach((type) => {
        emitter.emit(type, { type });
      });

      expect(callback).toHaveBeenCalledTimes(4);
    });

    it('should handle emitting without subscribers', () => {
      const emitter = createEventEmitter();

      expect(() => {
        emitter.emit('agent:stream', { test: true });
      }).not.toThrow();
    });

    it('should allow multiple subscriptions and unsubscriptions', () => {
      const emitter = createEventEmitter();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const unsub1 = emitter.subscribe(callback1);
      const unsub2 = emitter.subscribe(callback2);
      const unsub3 = emitter.subscribe(callback3);

      emitter.emit('feature:started', { test: 1 });
      expect(callback1).toHaveBeenCalledOnce();
      expect(callback2).toHaveBeenCalledOnce();
      expect(callback3).toHaveBeenCalledOnce();

      unsub2();

      emitter.emit('feature:started', { test: 2 });
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledOnce(); // Still just once
      expect(callback3).toHaveBeenCalledTimes(2);

      unsub1();
      unsub3();

      emitter.emit('feature:started', { test: 3 });
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledOnce();
      expect(callback3).toHaveBeenCalledTimes(2);
    });

    describe('throttling', () => {
      it('should throttle events based on default config', () => {
        vi.useFakeTimers();
        const emitter = createEventEmitter();
        const callback = vi.fn();

        emitter.subscribe(callback);

        // agent:stream has 50ms throttle by default
        emitter.emit('agent:stream', { msg: 1 });
        emitter.emit('agent:stream', { msg: 2 }); // Should be throttled
        emitter.emit('agent:stream', { msg: 3 }); // Should be throttled

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('agent:stream', { msg: 1 });

        vi.advanceTimersByTime(50);
        emitter.emit('agent:stream', { msg: 4 }); // Should not be throttled

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenLastCalledWith('agent:stream', { msg: 4 });

        vi.useRealTimers();
      });

      it('should not throttle events without throttle config', () => {
        const emitter = createEventEmitter();
        const callback = vi.fn();

        emitter.subscribe(callback);

        // feature:started is not in throttle config
        emitter.emit('feature:started', { id: 1 });
        emitter.emit('feature:started', { id: 2 });
        emitter.emit('feature:started', { id: 3 });

        expect(callback).toHaveBeenCalledTimes(3);
      });

      it('should support custom throttle config', () => {
        vi.useFakeTimers();
        const customConfig = { 'feature:started': 200 };
        const emitter = createEventEmitter(customConfig);
        const callback = vi.fn();

        emitter.subscribe(callback);

        emitter.emit('feature:started', { id: 1 });
        emitter.emit('feature:started', { id: 2 }); // Should be throttled

        expect(callback).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(199);
        emitter.emit('feature:started', { id: 3 }); // Should still be throttled

        expect(callback).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1);
        emitter.emit('feature:started', { id: 4 }); // Should not be throttled

        expect(callback).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
      });

      it('should throttle each event type independently', () => {
        vi.useFakeTimers();
        const customConfig = {
          'agent:stream': 50,
          'feature:started': 100,
        };
        const emitter = createEventEmitter(customConfig);
        const callback = vi.fn();

        emitter.subscribe(callback);

        emitter.emit('agent:stream', { msg: 1 });
        emitter.emit('feature:started', { id: 1 });
        emitter.emit('agent:stream', { msg: 2 }); // Throttled
        emitter.emit('feature:started', { id: 2 }); // Throttled

        expect(callback).toHaveBeenCalledTimes(2);

        vi.advanceTimersByTime(50);
        emitter.emit('agent:stream', { msg: 3 }); // Not throttled
        emitter.emit('feature:started', { id: 3 }); // Still throttled

        expect(callback).toHaveBeenCalledTimes(3);

        vi.advanceTimersByTime(50);
        emitter.emit('feature:started', { id: 4 }); // Not throttled

        expect(callback).toHaveBeenCalledTimes(4);

        vi.useRealTimers();
      });

      it('should allow disabling throttling with empty config', () => {
        const emitter = createEventEmitter({});
        const callback = vi.fn();

        emitter.subscribe(callback);

        // All events should pass through
        emitter.emit('agent:stream', { msg: 1 });
        emitter.emit('agent:stream', { msg: 2 });
        emitter.emit('agent:stream', { msg: 3 });

        expect(callback).toHaveBeenCalledTimes(3);
      });
    });
  });
});
