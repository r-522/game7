let counter = 0

export function newHitId(): string {
  return `hit_${++counter}`
}
