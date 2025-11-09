/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import { describe, it, expect } from 'vitest';
import LODPolicy from '../../../src/util/LODPolicy.js';

describe('LODPolicy', () => {
  describe('constructor', () => {
    it('creates policy with default values', () => {
      const policy = new LODPolicy({ maxGpuMB: 256 });
      expect(policy.maxGpuMB()).toBe(256);
      expect(policy.prefetchAhead()).toBe(2);
      expect(policy.evictionStrategy()).toBe('hybrid');
    });

    it('accepts custom values', () => {
      const policy = new LODPolicy({
        maxGpuMB: 512,
        prefetchAhead: 3,
        evictionStrategy: 'lru',
      });
      expect(policy.maxGpuMB()).toBe(512);
      expect(policy.prefetchAhead()).toBe(3);
      expect(policy.evictionStrategy()).toBe('lru');
    });

    it('throws on invalid eviction strategy', () => {
      expect(() => {
        new LODPolicy({ maxGpuMB: 256, evictionStrategy: 'invalid' });
      }).toThrow('Invalid eviction strategy');
    });
  });

  describe('maxGpuBytes', () => {
    it('converts MB to bytes correctly', () => {
      const policy = new LODPolicy({ maxGpuMB: 256 });
      expect(policy.maxGpuBytes()).toBe(256 * 1024 * 1024);
    });
  });

  describe('setMaxGpuMB', () => {
    it('updates max GPU memory', () => {
      const policy = new LODPolicy({ maxGpuMB: 256 });
      policy.setMaxGpuMB(512);
      expect(policy.maxGpuMB()).toBe(512);
      expect(policy.maxGpuBytes()).toBe(512 * 1024 * 1024);
    });
  });

  describe('setPrefetchAhead', () => {
    it('updates prefetch ahead count', () => {
      const policy = new LODPolicy({ maxGpuMB: 256 });
      policy.setPrefetchAhead(5);
      expect(policy.prefetchAhead()).toBe(5);
    });
  });

  describe('setEvictionStrategy', () => {
    it('updates eviction strategy', () => {
      const policy = new LODPolicy({ maxGpuMB: 256 });
      policy.setEvictionStrategy('distance');
      expect(policy.evictionStrategy()).toBe('distance');
    });

    it('throws on invalid strategy', () => {
      const policy = new LODPolicy({ maxGpuMB: 256 });
      expect(() => {
        policy.setEvictionStrategy('invalid');
      }).toThrow('Invalid eviction strategy');
    });
  });

  describe('calculateEvictionScore', () => {
    it('returns higher score for recently accessed tiles (LRU)', () => {
      const policy = new LODPolicy({ maxGpuMB: 256, evictionStrategy: 'lru' });

      const tile = { z: 2 };
      const currentTime = 1000;
      const recentScore = policy.calculateEvictionScore(tile, 900, 10, currentTime);
      const oldScore = policy.calculateEvictionScore(tile, 100, 10, currentTime);

      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('returns higher score for closer tiles (distance)', () => {
      const policy = new LODPolicy({ maxGpuMB: 256, evictionStrategy: 'distance' });

      const tile = { z: 2 };
      const currentTime = 1000;
      const closeScore = policy.calculateEvictionScore(tile, 500, 1, currentTime);
      const farScore = policy.calculateEvictionScore(tile, 500, 100, currentTime);

      expect(closeScore).toBeGreaterThan(farScore);
    });

    it('combines LRU and distance for hybrid strategy', () => {
      const policy = new LODPolicy({ maxGpuMB: 256, evictionStrategy: 'hybrid' });

      const tile = { z: 2 };
      const currentTime = 1000;

      // Recent + close should have highest score
      const score1 = policy.calculateEvictionScore(tile, 900, 1, currentTime);
      // Old + far should have lowest score
      const score2 = policy.calculateEvictionScore(tile, 100, 100, currentTime);

      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe('shouldPrefetchLevel', () => {
    it('returns true for levels within prefetch range', () => {
      const policy = new LODPolicy({ maxGpuMB: 256, prefetchAhead: 2 });

      expect(policy.shouldPrefetchLevel(3, 3)).toBe(true);
      expect(policy.shouldPrefetchLevel(3, 4)).toBe(true);
      expect(policy.shouldPrefetchLevel(3, 5)).toBe(true);
    });

    it('returns false for levels beyond prefetch range', () => {
      const policy = new LODPolicy({ maxGpuMB: 256, prefetchAhead: 2 });

      expect(policy.shouldPrefetchLevel(3, 6)).toBe(false);
      expect(policy.shouldPrefetchLevel(3, 7)).toBe(false);
    });

    it('respects prefetchAhead value of 0', () => {
      const policy = new LODPolicy({ maxGpuMB: 256, prefetchAhead: 0 });

      expect(policy.shouldPrefetchLevel(3, 3)).toBe(true);
      expect(policy.shouldPrefetchLevel(3, 4)).toBe(false);
    });
  });
});
