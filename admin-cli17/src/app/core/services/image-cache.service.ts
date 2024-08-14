import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ImageCacheService {
  private imageCache: Map<string, SafeUrl> = new Map();
  private observableCache: Map<string, Observable<SafeUrl>> = new Map();

  constructor(private sanitizer: DomSanitizer) { }

  getCachedImageUrl(imageKey: string): SafeUrl | null {
    return this.imageCache.get(imageKey) || null;
  }

  getOrLoadImageUrl(imageKey: string, imageLoader: () => Observable<Blob>): Observable<SafeUrl> {
    const cachedImage = this.imageCache.get(imageKey);
    if (cachedImage) {
      return new BehaviorSubject(cachedImage).asObservable();
    }

    const cachedObservable = this.observableCache.get(imageKey);
    if (cachedObservable) {
      return cachedObservable;
    }

    const imageObservable = imageLoader().pipe(
      map(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const safeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.imageCache.set(imageKey, safeUrl);
        return safeUrl;
      }),
      shareReplay(1)
    );

    this.observableCache.set(imageKey, imageObservable);
    return imageObservable;
  }
}
