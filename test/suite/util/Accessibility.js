/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

import { describe, it, expect, vi } from 'vitest';
import Accessibility from '../../../src/util/Accessibility.js';

describe('Accessibility', () => {
  describe('prefersReducedMotion', () => {
    it('detects reduced motion preference', () => {
      // Note: In test environment, this will return false
      const result = Accessibility.prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('adjustTransitionDuration', () => {
    it('returns original duration when no reduced motion', () => {
      vi.spyOn(Accessibility, 'prefersReducedMotion').mockReturnValue(false);
      expect(Accessibility.adjustTransitionDuration(1000)).toBe(1000);
      expect(Accessibility.adjustTransitionDuration(500)).toBe(500);
    });

    it('reduces duration when reduced motion preferred', () => {
      vi.spyOn(Accessibility, 'prefersReducedMotion').mockReturnValue(true);

      const original = 1000;
      const adjusted = Accessibility.adjustTransitionDuration(original);

      expect(adjusted).toBeLessThan(original);
      expect(adjusted).toBeLessThanOrEqual(100); // Capped at 100ms
    });

    it('disables transition when disable flag is true', () => {
      vi.spyOn(Accessibility, 'prefersReducedMotion').mockReturnValue(true);
      expect(Accessibility.adjustTransitionDuration(1000, true)).toBe(0);
    });
  });

  describe('setAriaAttributes', () => {
    it('sets ARIA attributes on element', () => {
      if (typeof document === 'undefined') return;

      const element = document.createElement('div');

      Accessibility.setAriaAttributes(element, {
        role: 'button',
        label: 'Test Button',
        pressed: 'false',
      });

      expect(element.getAttribute('role')).toBe('button');
      expect(element.getAttribute('aria-label')).toBe('Test Button');
      expect(element.getAttribute('aria-pressed')).toBe('false');
    });

    it('handles null values', () => {
      if (typeof document === 'undefined') return;

      const element = document.createElement('div');
      element.setAttribute('aria-label', 'Initial');

      Accessibility.setAriaAttributes(element, {
        label: null,
      });

      expect(element.hasAttribute('aria-label')).toBe(false);
    });

    it('handles null element gracefully', () => {
      expect(() => {
        Accessibility.setAriaAttributes(null, { label: 'Test' });
      }).not.toThrow();
    });
  });

  describe('setFocusOrder', () => {
    it('sets tabindex and focus order', () => {
      if (typeof document === 'undefined') return;

      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div'),
      ];

      Accessibility.setFocusOrder(elements);

      elements.forEach((el, index) => {
        expect(el.getAttribute('tabindex')).toBe('0');
        expect(el.dataset.focusOrder).toBe(index.toString());
      });
    });
  });

  describe('getTabbableElements', () => {
    it('finds tabbable elements in container', () => {
      if (typeof document === 'undefined') return;

      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text">
        <button disabled>Disabled</button>
        <div tabindex="0">Tabbable</div>
      `;

      const tabbable = Accessibility.getTabbableElements(container);
      expect(tabbable.length).toBeGreaterThanOrEqual(3);
    });

    it('returns empty array for null container', () => {
      const result = Accessibility.getTabbableElements(null);
      expect(result).toEqual([]);
    });
  });

  describe('announce', () => {
    it('creates live region for announcements', () => {
      if (typeof document === 'undefined') return;

      // Clean up any existing live region
      const existing = document.getElementById('marzipano-live-region');
      if (existing) {
        existing.remove();
      }

      Accessibility.announce('Test message', 'polite');

      const liveRegion = document.getElementById('marzipano-live-region');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.textContent).toBe('Test message');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    });

    it('reuses existing live region', () => {
      if (typeof document === 'undefined') return;

      Accessibility.announce('First message');
      const region1 = document.getElementById('marzipano-live-region');

      Accessibility.announce('Second message');
      const region2 = document.getElementById('marzipano-live-region');

      expect(region1).toBe(region2); // Same element
      expect(region2.textContent).toBe('Second message');
    });

    it('supports assertive priority', () => {
      if (typeof document === 'undefined') return;

      // Clean up
      const existing = document.getElementById('marzipano-live-region');
      if (existing) existing.remove();

      Accessibility.announce('Important!', 'assertive');
      const liveRegion = document.getElementById('marzipano-live-region');

      expect(liveRegion.getAttribute('aria-live')).toBe('assertive');
    });
  });
});
