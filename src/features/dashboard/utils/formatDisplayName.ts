export function formatDisplayName(firstName: string, lastName: string): string {
  const trimmedFirst = firstName.trim();
  const initial = lastName.trim().charAt(0);

  if (!initial) {
    return trimmedFirst;
  }

  return `${trimmedFirst} ${initial.toUpperCase()}.`;
}
