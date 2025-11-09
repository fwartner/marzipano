/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import { describe, it, expect, vi } from 'vitest';
import RayPicker from '../../../src/util/RayPicker.js';

describe('RayPicker', () => {
  describe('screenToCoordinates', () => {
    it('converts screen coordinates to yaw/pitch', () => {
      const mockView = {
        screenToCoordinates: vi.fn((screen) => ({
          yaw: screen.x * Math.PI,
          pitch: (screen.y * Math.PI) / 2,
        })),
      };

      const stageSize = { width: 800, height: 600 };
      const result = RayPicker.screenToCoordinates(400, 300, mockView, stageSize);

      expect(result).toBeDefined();
      expect(result.yaw).toBeDefined();
      expect(result.pitch).toBeDefined();
      expect(mockView.screenToCoordinates).toHaveBeenCalled();
    });

    it('returns null when view lacks screenToCoordinates', () => {
      const mockView = {}; // No screenToCoordinates method
      const stageSize = { width: 800, height: 600 };

      const result = RayPicker.screenToCoordinates(400, 300, mockView, stageSize);
      expect(result).toBe(null);
    });

    it('returns null when unprojection fails', () => {
      const mockView = {
        screenToCoordinates: vi.fn(() => {
          throw new Error('Out of bounds');
        }),
      };

      const stageSize = { width: 800, height: 600 };
      const result = RayPicker.screenToCoordinates(400, 300, mockView, stageSize);

      expect(result).toBe(null);
    });

    it('normalizes screen coordinates correctly', () => {
      const mockView = {
        screenToCoordinates: vi.fn((screen) => ({ yaw: 0, pitch: 0 })),
      };

      const stageSize = { width: 800, height: 600 };
      RayPicker.screenToCoordinates(400, 300, mockView, stageSize);

      // Center of screen (400, 300) should map to (0, 0) in normalized coords
      const call = mockView.screenToCoordinates.mock.calls[0][0];
      expect(call.x).toBeCloseTo(0, 1);
      expect(call.y).toBeCloseTo(0, 1);
    });
  });

  describe('coordinatesToScreen', () => {
    it('converts yaw/pitch to screen coordinates', () => {
      const mockView = {
        coordinatesToScreen: vi.fn(() => ({ x: 0, y: 0 })),
      };

      const stageSize = { width: 800, height: 600 };
      const result = RayPicker.coordinatesToScreen(0, 0, mockView, stageSize);

      expect(result).toBeDefined();
      expect(result.x).toBe(400); // Center x
      expect(result.y).toBe(300); // Center y
    });

    it('returns null when view lacks coordinatesToScreen', () => {
      const mockView = {};
      const stageSize = { width: 800, height: 600 };

      const result = RayPicker.coordinatesToScreen(0, 0, mockView, stageSize);
      expect(result).toBe(null);
    });

    it('returns null when projection fails', () => {
      const mockView = {
        coordinatesToScreen: vi.fn(() => {
          throw new Error('Out of view');
        }),
      };

      const stageSize = { width: 800, height: 600 };
      const result = RayPicker.coordinatesToScreen(0, 0, mockView, stageSize);

      expect(result).toBe(null);
    });
  });

  describe('isVisible', () => {
    it('returns true for coordinates in viewport', () => {
      const mockView = {
        coordinatesToScreen: vi.fn(() => ({ x: 0, y: 0 })),
      };

      const result = RayPicker.isVisible(0, 0, mockView);
      expect(result).toBe(true);
    });

    it('returns false for coordinates out of viewport', () => {
      const mockView = {
        coordinatesToScreen: vi.fn(() => ({ x: 2, y: 0 })), // Outside [-1, 1] range
      };

      const result = RayPicker.isVisible(0, 0, mockView);
      expect(result).toBe(false);
    });

    it('returns false when projection fails', () => {
      const mockView = {
        coordinatesToScreen: vi.fn(() => {
          throw new Error('Behind camera');
        }),
      };

      const result = RayPicker.isVisible(Math.PI, 0, mockView);
      expect(result).toBe(false);
    });

    it('returns true when view lacks coordinatesToScreen', () => {
      const mockView = {};
      const result = RayPicker.isVisible(0, 0, mockView);
      expect(result).toBe(true); // Assume visible if can't check
    });
  });

  describe('angularDistance', () => {
    it('calculates distance between same points', () => {
      const distance = RayPicker.angularDistance(0, 0, 0, 0);
      expect(distance).toBeCloseTo(0, 5);
    });

    it('calculates distance between opposite points', () => {
      const distance = RayPicker.angularDistance(0, 0, Math.PI, 0);
      expect(distance).toBeCloseTo(Math.PI, 2);
    });

    it('calculates distance for perpendicular points', () => {
      const distance = RayPicker.angularDistance(0, 0, Math.PI / 2, 0);
      expect(distance).toBeCloseTo(Math.PI / 2, 2);
    });

    it('is symmetric', () => {
      const yaw1 = 0.5;
      const pitch1 = 0.3;
      const yaw2 = 1.2;
      const pitch2 = -0.4;

      const d1 = RayPicker.angularDistance(yaw1, pitch1, yaw2, pitch2);
      const d2 = RayPicker.angularDistance(yaw2, pitch2, yaw1, pitch1);

      expect(d1).toBeCloseTo(d2, 5);
    });
  });
});
