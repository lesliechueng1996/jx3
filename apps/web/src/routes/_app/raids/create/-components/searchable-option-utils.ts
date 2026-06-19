export const matchesOptionSearch = (
  query: string,
  parts: string[],
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return parts.some((part) => part.toLowerCase().includes(normalized));
};

export const formatServerLabel = (server: {
  zone: string;
  name: string;
}): string => `${server.zone} · ${server.name}`;
