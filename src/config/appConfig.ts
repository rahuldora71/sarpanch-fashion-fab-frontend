const getEnvNumber = (
  value: string | undefined,
  fallback: number
): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

export const APP_CONFIG = {
  customers: {
    pageSize: getEnvNumber(
      import.meta.env.VITE_CUSTOMERS_PAGE_SIZE,
      20
    ),
  },
  services: {
  pageSize: 50,
},
};