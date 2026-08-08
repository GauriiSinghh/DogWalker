// src/utils/cacheStore.js

const cache = new Map();
const inFlightRequests = new Map();

export const cacheStore = {
  /**
   * Retrieves data from the cache.
   * @param {string} key
   * @returns {{ data: any, isStale: boolean } | null}
   */
  get(key) {
    const entry = cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    return {
      data: entry.data,
      isStale: isExpired,
    };
  },

  /**
   * Caches data under a key with a TTL.
   * @param {string} key
   * @param {any} data
   * @param {number} ttl
   */
  set(key, data, ttl = 300000) { // Default TTL: 5 minutes
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  /**
   * Removes an entry from the cache.
   * @param {string} key
   */
  delete(key) {
    cache.delete(key);
  },

  /**
   * Clears the entire cache.
   */
  clear() {
    cache.clear();
  },

  /**
   * Deduplicates simultaneous requests and stores the result in cache on success.
   * @param {string} key
   * @param {() => Promise<any>} fetchFn
   * @param {number} ttl
   * @returns {Promise<any>}
   */
  getOrFetch(key, fetchFn, ttl = 300000) {
    const cached = cache.get(key);
    if (cached) {
      const isExpired = Date.now() - cached.timestamp > cached.ttl;
      if (!isExpired) {
        return Promise.resolve(cached.data);
      }
    }

    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    const promise = fetchFn()
      .then((data) => {
        inFlightRequests.delete(key);
        this.set(key, data, ttl);
        return data;
      })
      .catch((err) => {
        inFlightRequests.delete(key);
        throw err;
      });

    inFlightRequests.set(key, promise);
    return promise;
  }
};
