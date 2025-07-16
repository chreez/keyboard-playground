// AI Analysis Web Worker
// Handles AI requests in the background to avoid blocking the main thread

import { AIResponseCache } from '../educational/aiResponseCache.js';

class AIAnalysisWorker {
  constructor() {
    this.cache = new AIResponseCache();
    this.isProcessing = false;
    this.requestQueue = [];
    this.maxQueueSize = 10;
    
    // Set up message handler
    self.onmessage = this.handleMessage.bind(this);
  }

  async handleMessage(event) {
    const { type, data, requestId } = event.data;
    
    try {
      switch (type) {
        case 'analyze':
          await this.handleAnalysisRequest(data, requestId);
          break;
        case 'clear-cache':
          this.cache.clearCache();
          this.postResponse('cache-cleared', null, requestId);
          break;
        case 'get-stats':
          this.postResponse('stats', this.cache.getCacheStats(), requestId);
          break;
        default:
          this.postError('Unknown request type', requestId);
      }
    } catch (error) {
      this.postError(error.message, requestId);
    }
  }

  async handleAnalysisRequest(context, requestId) {
    // Add to queue if currently processing
    if (this.isProcessing) {
      if (this.requestQueue.length >= this.maxQueueSize) {
        this.requestQueue.shift(); // Remove oldest request
      }
      this.requestQueue.push({ context, requestId });
      return;
    }

    this.isProcessing = true;
    
    try {
      // Get response from cache (might be immediate or async)
      const response = await this.cache.getResponse(context);
      
      // Post response back to main thread
      this.postResponse('analysis-complete', {
        context,
        response,
        timestamp: Date.now()
      }, requestId);
      
    } catch (error) {
      this.postError(error.message, requestId);
    } finally {
      this.isProcessing = false;
      
      // Process next queued request
      if (this.requestQueue.length > 0) {
        const { context: nextContext, requestId: nextRequestId } = this.requestQueue.shift();
        setTimeout(() => this.handleAnalysisRequest(nextContext, nextRequestId), 0);
      }
    }
  }

  postResponse(type, data, requestId) {
    self.postMessage({
      type,
      data,
      requestId,
      timestamp: Date.now()
    });
  }

  postError(error, requestId) {
    self.postMessage({
      type: 'error',
      error,
      requestId,
      timestamp: Date.now()
    });
  }
}

// Initialize worker
const worker = new AIAnalysisWorker();

// Handle uncaught errors
self.onerror = function(error) {
  console.error('Worker error:', error);
  self.postMessage({
    type: 'error',
    error: error.message,
    timestamp: Date.now()
  });
};