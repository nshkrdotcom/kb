/**
 * Events.js
 * 
 * Event handling system for communication between components
 * and with the parent application.
 */

class Events {
    constructor(nexusCore) {
      this.nexusCore = nexusCore;
      this.listeners = new Map();
    }
    
    /**
     * Register an event listener
     */
    on(eventType, callback) {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }
      
      this.listeners.get(eventType).push(callback);
      
      // Return function to remove listener
      return () => {
        this.off(eventType, callback);
      };
    }
    
    /**
     * Remove an event listener
     */
    off(eventType, callback) {
      if (!this.listeners.has(eventType)) return;
      
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
    
    /**
     * Dispatch an event
     */
    dispatch(eventType, data) {
      if (!this.listeners.has(eventType)) return;
      
      // Call all registered callbacks
      const callbacks = this.listeners.get(eventType);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
      
      // Also dispatch to parent application if React component
      this._dispatchToReact(eventType, data);
    }
    
    /**
     * Dispatch event to parent React component
     */
    _dispatchToReact(eventType, data) {
      if (this.nexusCore.canvas && this.nexusCore.canvas.dispatchEvent) {
        const customEvent = new CustomEvent(`nexuscore:${eventType}`, {
          bubbles: true,
          detail: data
        });
        
        this.nexusCore.canvas.dispatchEvent(customEvent);
      }
    }
    
    /**
     * Clean up event listeners
     */
    dispose() {
      this.listeners.clear();
    }
  }