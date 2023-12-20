export function secondsToHumanReadable(input: number) {
  if (isNaN(input)) {
    return '';
  }

  const n = Math.round(input);
  const m = Math.floor(n / 60);
  const s = n % 60;

  return `${m}:${s < 10 ? `0${s}` : s}`;
}
