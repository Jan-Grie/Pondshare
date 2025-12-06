export function formatBytes(bytes?: number): string {
  
  if (!bytes || isNaN(bytes)) return '0 B';

  const base = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  
  if (bytes === 0) return '0 B';

  const isSoftGB =
    bytes >= 1000 * base * base &&
    bytes < base * base * base;

  const exponent = isSoftGB
    ? 3
    : Math.floor(Math.log(bytes) / Math.log(base));

  const size = bytes / Math.pow(base, exponent);

  let formatted = size
    .toFixed(exponent === 0 ? 0 : 2)
    .replace(/\.?0+$/, '');

  return `${formatted} ${units[exponent]}`;
}
