const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Produce multi-size renditions of an uploaded image.
 * Given an absolute input path, writes 4 JPEGs next to it and returns relative URLs.
 *
 *   - thumb:   160 x 160   (grid/recommendation cards)
 *   - small:   400 x 400
 *   - medium:  800 x 800   (product detail gallery)
 *   - large:   1600 x 1600 (zoom)
 */
const SIZES = [
  { name: 'thumb',  size: 160 },
  { name: 'small',  size: 400 },
  { name: 'medium', size: 800 },
  { name: 'large',  size: 1600 },
];

const processImage = async (absInputPath, uploadsBaseDir) => {
  const basename = path.basename(absInputPath, path.extname(absInputPath));
  const dir = path.dirname(absInputPath);
  const renditions = {};

  for (const { name, size } of SIZES) {
    const outRelDir = path.relative(uploadsBaseDir, dir).replace(/\\/g, '/');
    const outFile = `${basename}.${name}.jpg`;
    const outAbs = path.join(dir, outFile);

    await sharp(absInputPath)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outAbs);

    renditions[name] = `/uploads/${outRelDir ? outRelDir + '/' : ''}${outFile}`;
  }

  // Best-effort blurhash (if available) — skip if we can't compute cheaply
  try {
    const { data, info } = await sharp(absInputPath)
      .resize(32, 32, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    renditions.blurDataUrl = `data:image/svg+xml;base64,${Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}"><rect width="100%" height="100%" fill="#ddd"/></svg>`
    ).toString('base64')}`;
  } catch (_) { /* ignore */ }

  return renditions;
};

module.exports = { processImage, SIZES };
