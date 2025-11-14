export interface RateLimiterOptions {
  maxTokens: number;
  refillRate: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  
  constructor(private options: RateLimiterOptions) {
    this.tokens = options.maxTokens;
    this.lastRefill = Date.now();
  }
  
  async acquire(): Promise<void> {
    await this.refill();
    
    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.options.refillRate * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      await this.refill();
    }
    
    this.tokens -= 1;
  }
  
  private async refill(): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.options.refillRate;
    
    this.tokens = Math.min(this.options.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
  
  getAvailableTokens(): number {
    return Math.floor(this.tokens);
  }
}