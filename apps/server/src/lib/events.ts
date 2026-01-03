/**
 * Event emitter for streaming events to WebSocket clients
 */

import type { EventType, EventCallback } from '@automaker/types';

// Re-export event types from shared package
export type { EventType, EventCallback };

export interface EventEmitter {
  emit: (type: EventType, payload: unknown) => void;
  subscribe: (callback: EventCallback) => () => void;
}

/**
 * Throttle configuration: milliseconds between emissions for specific event types
 */
interface ThrottleConfig {
  [eventType: string]: number;
}

/**
 * Default throttle configuration to reduce event emission spam
 */
const defaultThrottleConfig: ThrottleConfig = {
  auto_mode_progress: 100,
  'agent:stream': 50,
  auto_mode_idle: 60000,
};

export function createEventEmitter(
  throttleConfig: ThrottleConfig = defaultThrottleConfig
): EventEmitter {
  const subscribers = new Set<EventCallback>();
  const lastEmitTime = new Map<string, number>();

  return {
    emit(type: EventType, payload: unknown) {
      // Check throttle
      const throttleMs = throttleConfig[type];
      if (throttleMs) {
        const now = Date.now();
        const lastTime = lastEmitTime.get(type) || 0;
        if (now - lastTime < throttleMs) {
          return; // Throttled, skip emission
        }
        lastEmitTime.set(type, now);
      }

      // Emit to all subscribers
      for (const callback of subscribers) {
        try {
          callback(type, payload);
        } catch (error) {
          console.error('Error in event subscriber:', error);
        }
      }
    },

    subscribe(callback: EventCallback) {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
  };
}
