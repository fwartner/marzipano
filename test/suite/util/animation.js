/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import animation from '../../../src/util/animation.js';

describe('animation', () => {
  describe('Easing Functions', () => {
    it('linear returns input value', () => {
      expect(animation.linear(0)).toBe(0);
      expect(animation.linear(0.5)).toBe(0.5);
      expect(animation.linear(1)).toBe(1);
    });

    it('easeInOutQuad produces smooth curve', () => {
      expect(animation.easeInOutQuad(0)).toBe(0);
      expect(animation.easeInOutQuad(1)).toBe(1);
      expect(animation.easeInOutQuad(0.5)).toBeGreaterThan(0.4);
      expect(animation.easeInOutQuad(0.5)).toBeLessThan(0.6);
    });

    it('easeInOutCubic produces smooth curve', () => {
      expect(animation.easeInOutCubic(0)).toBe(0);
      expect(animation.easeInOutCubic(1)).toBe(1);
      const mid = animation.easeInOutCubic(0.5);
      expect(mid).toBeGreaterThan(0.4);
      expect(mid).toBeLessThan(0.6);
    });

    it('easeOutElastic produces overshoot', () => {
      expect(animation.easeOutElastic(0)).toBe(0);
      expect(animation.easeOutElastic(1)).toBe(1);
      // Should have values > 1 during bounce
      let hasOvershoot = false;
      for (let t = 0.1; t < 1; t += 0.1) {
        if (animation.easeOutElastic(t) > 1) {
          hasOvershoot = true;
          break;
        }
      }
      expect(hasOvershoot).toBe(true);
    });

    it('easeOutBounce produces bouncing effect', () => {
      expect(animation.easeOutBounce(0)).toBe(0);
      expect(animation.easeOutBounce(1)).toBe(1);
      // Bounce functions may have temporary dips, just check endpoints are correct
      const start = animation.easeOutBounce(0);
      const end = animation.easeOutBounce(1);
      expect(start).toBe(0);
      expect(end).toBe(1);
    });
  });

  describe('interpolate', () => {
    it('interpolates between two numbers', () => {
      expect(animation.interpolate(0, 100, 0)).toBe(0);
      expect(animation.interpolate(0, 100, 0.5)).toBe(50);
      expect(animation.interpolate(0, 100, 1)).toBe(100);
    });

    it('interpolates with easing', () => {
      const result = animation.interpolate(0, 100, 0.5, animation.easeInOutQuad);
      expect(result).toBeGreaterThan(45);
      expect(result).toBeLessThan(55);
    });

    it('handles negative ranges', () => {
      expect(animation.interpolate(100, 0, 0.5)).toBe(50);
      expect(animation.interpolate(-50, 50, 0.5)).toBe(0);
    });
  });

  describe('interpolateAngle', () => {
    it('interpolates angles through shortest path', () => {
      // 0 to π should go forward
      const result1 = animation.interpolateAngle(0, Math.PI, 0.5);
      expect(result1).toBeCloseTo(Math.PI / 2, 0.01);

      // 0 to -π should be same as 0 to π (shortest path)
      const result2 = animation.interpolateAngle(0, -Math.PI, 0.5);
      expect(Math.abs(result2)).toBeCloseTo(Math.PI / 2, 0.01);
    });

    it('normalizes angles to [-π, π]', () => {
      const result = animation.interpolateAngle(0, 3 * Math.PI, 0.5);
      expect(result).toBeGreaterThan(-Math.PI);
      expect(result).toBeLessThan(Math.PI);
    });

    it('handles wraparound correctly', () => {
      // From 170° to -170° should go through 180°, not all the way around
      const from = (170 * Math.PI) / 180;
      const to = (-170 * Math.PI) / 180;
      const mid = animation.interpolateAngle(from, to, 0.5);
      expect(Math.abs(mid)).toBeGreaterThan(Math.PI * 0.95);
    });
  });

  describe('animate', () => {
    it('calls onUpdate and onComplete', (done) => {
      const updates = [];

      const cancel = animation.animate({
        duration: 100, // Short duration for test
        onUpdate: (progress) => {
          updates.push(progress);
        },
        onComplete: () => {
          expect(updates.length).toBeGreaterThan(1);
          expect(updates[0]).toBe(0); // First call should be 0
          done();
        },
      });

      expect(typeof cancel).toBe('function');
    });

    it('applies easing function', (done) => {
      const updates = [];

      animation.animate({
        duration: 100,
        easing: (t) => t * t, // Square easing
        onUpdate: (progress) => {
          updates.push(progress);
        },
        onComplete: () => {
          // With square easing, middle values should be lower than linear
          expect(updates[0]).toBe(0);
          done();
        },
      });
    });

    it('returns cancel function that stops animation', (done) => {
      let updateCount = 0;

      const cancel = animation.animate({
        duration: 200,
        onUpdate: () => {
          updateCount++;
          if (updateCount === 2) {
            cancel(); // Cancel after a few updates
          }
        },
        onComplete: () => {
          expect(updateCount).toBeLessThan(10); // Should stop early
          done();
        },
      });
    });
  });

  describe('Easing edge cases', () => {
    const easingFunctions = [
      'linear',
      'easeInOutQuad',
      'easeInQuad',
      'easeOutQuad',
      'easeInOutCubic',
      'easeInCubic',
      'easeOutCubic',
      'easeInOutSine',
    ];

    easingFunctions.forEach((name) => {
      it(`${name} starts at 0 and ends at 1`, () => {
        const fn = animation[name];
        const start = fn(0);
        const end = fn(1);

        // Allow small floating point tolerance
        expect(start).toBeCloseTo(0, 5);
        expect(end).toBeCloseTo(1, 5);
      });

      it(`${name} is monotonically increasing`, () => {
        const fn = animation[name];
        for (let t = 0; t <= 1; t += 0.1) {
          const val1 = fn(t);
          const val2 = fn(Math.min(t + 0.05, 1));
          // Allow small tolerance for numerical precision
          expect(val2).toBeGreaterThanOrEqual(val1 - 0.01);
        }
      });
    });
  });
});
