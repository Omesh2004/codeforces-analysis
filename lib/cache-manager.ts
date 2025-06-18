// Client-side cache manager for student data
class CacheManager {
  private cache = new Map<string, any>()
  private cacheTimestamps = new Map<string, number>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

  // Generate cache key
  private getCacheKey(studentId: string, endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ""
    return `${studentId}-${endpoint}-${paramString}`
  }

  // Check if cache is valid
  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key)
    if (!timestamp) return false

    const now = Date.now()
    return now - timestamp < this.CACHE_DURATION
  }

  // Get data from cache
  get(studentId: string, endpoint: string, params?: Record<string, any>): any | null {
    const key = this.getCacheKey(studentId, endpoint, params)

    if (this.isCacheValid(key)) {
      console.log(`Cache hit for ${key}`)
      return this.cache.get(key)
    }

    // Remove expired cache
    this.cache.delete(key)
    this.cacheTimestamps.delete(key)
    return null
  }

  // Set data in cache
  set(studentId: string, endpoint: string, data: any, params?: Record<string, any>): void {
    const key = this.getCacheKey(studentId, endpoint, params)
    this.cache.set(key, data)
    this.cacheTimestamps.set(key, Date.now())
    console.log(`Cache set for ${key}`)
  }

  // Clear cache for a specific student
  clearStudent(studentId: string): void {
    const keysToDelete = []
    for (const key of this.cache.keys()) {
      if (key.startsWith(studentId)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key)
      this.cacheTimestamps.delete(key)
    })

    console.log(`Cleared cache for student ${studentId}`)
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear()
    this.cacheTimestamps.clear()
    console.log("Cleared all cache")
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const cacheManager = new CacheManager()
