type QueryValue = string | number | boolean | undefined | null;

export const buildQueryString = (
  params: Record<string, QueryValue>,
): string => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
};
