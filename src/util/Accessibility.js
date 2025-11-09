/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @class Accessibility
 * @classdesc
 *
 * Utilities for accessibility features including motion preferences
 * and ARIA attribute management.
 */
class Accessibility {
  /**
   * Check if user prefers reduced motion
   * @return {boolean}
   */
  static prefersReducedMotion() {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery && mediaQuery.matches;
  }

  /**
   * Adjust transition duration based on reduced motion preference
   * @param {number} duration - Original duration in milliseconds
   * @param {boolean} [disable=false] - Whether to disable transition entirely
   * @return {number} Adjusted duration
   */
  static adjustTransitionDuration(duration, disable = false) {
    if (Accessibility.prefersReducedMotion()) {
      if (disable) {
        return 0; // No transition
      }
      return Math.min(duration * 0.1, 100); // Reduce to 10% or 100ms max
    }
    return duration;
  }

  /**
   * Set ARIA attributes on a DOM element
   * @param {HTMLElement} element
   * @param {Object} attrs - Attribute map (e.g., {role: 'button', label: 'Click me'})
   */
  static setAriaAttributes(element, attrs) {
    if (!element || !attrs) {
      return;
    }

    for (const key in attrs) {
      const value = attrs[key];
      const attrName = key === 'label' ? 'aria-label' : key === 'role' ? 'role' : `aria-${key}`;

      if (value !== null && value !== undefined) {
        element.setAttribute(attrName, value.toString());
      } else {
        element.removeAttribute(attrName);
      }
    }
  }

  /**
   * Set keyboard focus order for a group of elements
   * @param {HTMLElement[]} elements - Array of elements to make tabbable
   */
  static setFocusOrder(elements) {
    if (!elements || !Array.isArray(elements)) {
      return;
    }

    elements.forEach((element, index) => {
      if (element) {
        element.setAttribute('tabindex', '0');
        // Store original order for restoration if needed
        element.dataset.focusOrder = index.toString();
      }
    });
  }

  /**
   * Focus the first element in a container
   * @param {HTMLElement} container
   * @return {boolean} True if an element was focused
   */
  static focusFirst(container) {
    if (!container) {
      return false;
    }

    const focusable = container.querySelectorAll(
      '[tabindex="0"], button, a[href], input, select, textarea'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
      return true;
    }

    return false;
  }

  /**
   * Get all tabbable elements in a container
   * @param {HTMLElement} container
   * @return {HTMLElement[]}
   */
  static getTabbableElements(container) {
    if (!container) {
      return [];
    }

    const selector =
      '[tabindex="0"], button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
    return Array.from(container.querySelectorAll(selector));
  }

  /**
   * Navigate to next tabbable element
   * @param {HTMLElement} container
   * @param {HTMLElement} currentElement
   * @return {boolean} True if navigation occurred
   */
  static focusNext(container, currentElement) {
    const tabbable = Accessibility.getTabbableElements(container);
    const currentIndex = tabbable.indexOf(currentElement);

    if (currentIndex >= 0 && currentIndex < tabbable.length - 1) {
      tabbable[currentIndex + 1].focus();
      return true;
    }

    return false;
  }

  /**
   * Navigate to previous tabbable element
   * @param {HTMLElement} container
   * @param {HTMLElement} currentElement
   * @return {boolean} True if navigation occurred
   */
  static focusPrevious(container, currentElement) {
    const tabbable = Accessibility.getTabbableElements(container);
    const currentIndex = tabbable.indexOf(currentElement);

    if (currentIndex > 0) {
      tabbable[currentIndex - 1].focus();
      return true;
    }

    return false;
  }

  /**
   * Announce a message to screen readers
   * @param {string} message
   * @param {string} [priority='polite'] - 'polite' or 'assertive'
   */
  static announce(message, priority = 'polite') {
    if (typeof document === 'undefined') {
      return;
    }

    // Create or get live region
    let liveRegion = document.getElementById('marzipano-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'marzipano-live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    // Update message
    liveRegion.textContent = message;
  }
}

export default Accessibility;
