import React from 'react';
import { getImageUrl } from '../../services/api';

/**
 * Drop-in <img> replacement that uses the multi-size renditions produced by
 * the upload pipeline. Pass the "large" URL and it will auto-derive smaller
 * variants via filename convention (...thumb.webp / ...small.webp / ...medium.webp).
 *
 * Graceful fallback: if the URL doesn't match the pattern, we just render it.
 */
const deriveVariants = (url) => {
  if (!url || typeof url !== 'string') return null;
  // Matches /uploads/images/<name>.large.webp
  const m = url.match(/^(.*?)\.(thumb|small|medium|large)\.webp$/);
  if (!m) return null;
  const base = m[1];
  return {
    thumb:  `${base}.thumb.webp`,
    small:  `${base}.small.webp`,
    medium: `${base}.medium.webp`,
    large:  `${base}.large.webp`,
  };
};

const ResponsiveImage = ({ src, alt, width, height, sizes, loading = 'lazy', style, className, ...rest }) => {
  const variants = deriveVariants(src);
  const abs = (u) => getImageUrl(u);

  if (!variants) {
    return (
      <img
        src={abs(src)}
        alt={alt || ''}
        loading={loading}
        width={width}
        height={height}
        style={style}
        className={className}
        {...rest}
      />
    );
  }

  const srcSet = [
    `${abs(variants.thumb)} 160w`,
    `${abs(variants.small)} 400w`,
    `${abs(variants.medium)} 800w`,
    `${abs(variants.large)} 1600w`,
  ].join(', ');

  return (
    <img
      src={abs(variants.medium)}
      srcSet={srcSet}
      sizes={sizes || '(max-width: 600px) 50vw, (max-width: 960px) 33vw, 25vw'}
      alt={alt || ''}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      style={style}
      className={className}
      {...rest}
    />
  );
};

export default ResponsiveImage;
