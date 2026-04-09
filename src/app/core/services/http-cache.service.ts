import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap, catchError, throwError } from 'rxjs';

interface CacheEntry<T> {
  ts: number;
  obs: Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class HttpCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  readonly defaultTTL = 60_000;

  getOrSet<T>(key: string, fetchFn: () => Observable<T>, ttl = this.defaultTTL): Observable<T> {
    const now = Date.now();
    const existing = this.cache.get(key) as CacheEntry<T> | undefined;
    if (existing && now - existing.ts < ttl) {
      return existing.obs;
    }

    const obs = fetchFn().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      tap(() => this.cache.set(key, { ts: Date.now(), obs })),
      catchError((err) => {
        this.cache.delete(key);
        return throwError(() => err);
      })
    );

    this.cache.set(key, { ts: now, obs });
    return obs;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string) {
    for (const k of Array.from(this.cache.keys())) {
      if (k.startsWith(prefix)) {
        this.cache.delete(k);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}
