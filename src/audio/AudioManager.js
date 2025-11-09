/*
 * Copyright 2025 Marzipano Contributors. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 */

/**
 * @class AudioManager
 * @classdesc
 *
 * Manages a shared AudioContext for the application.
 * Handles browser autoplay policies and context state.
 */
class AudioManager {
  constructor() {
    this._context = null;
    this._unlocked = false;
  }

  /**
   * Get or create the audio context
   * @return {AudioContext}
   */
  getContext() {
    if (!this._context) {
      // Create AudioContext (with vendor prefixes for compatibility)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }
      this._context = new AudioContextClass();
    }
    return this._context;
  }

  /**
   * Check if audio context is running
   * @return {boolean}
   */
  isRunning() {
    return this._context && this._context.state === 'running';
  }

  /**
   * Resume audio context (required for browser autoplay policies)
   * Call this in response to user interaction
   * @return {Promise}
   */
  async resume() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
      this._unlocked = true;
    }
    return ctx;
  }

  /**
   * Suspend audio context
   * @return {Promise}
   */
  async suspend() {
    const ctx = this.getContext();
    if (ctx.state === 'running') {
      await ctx.suspend();
    }
  }

  /**
   * Check if audio has been unlocked by user interaction
   * @return {boolean}
   */
  isUnlocked() {
    return this._unlocked;
  }

  /**
   * Close the audio context
   */
  close() {
    if (this._context) {
      this._context.close();
      this._context = null;
      this._unlocked = false;
    }
  }

  /**
   * Get the current time from the audio context
   * @return {number}
   */
  getCurrentTime() {
    return this._context ? this._context.currentTime : 0;
  }
}

// Singleton instance
const audioManager = new AudioManager();

export default audioManager;
