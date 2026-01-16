'use client';

import { getOptimizedImageUrl } from './utils/imageOptimizer';

export default function myImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
    return getOptimizedImageUrl(src, width, quality || 75);
}
