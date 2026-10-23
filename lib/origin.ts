export function isAllowedOrigin(input: {
  origin: string | null;
  host: string | null;
  forwardedHost: string | null;
}): boolean {
  const origin = input.origin?.trim();
  
  if (!origin || origin === "") {
    return true;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }

  const host = input.forwardedHost ?? input.host;
  if (!host) {
    return false;
  }

  const hostNormalized = host.split(",")[0].trim().toLowerCase();

  return originHost === hostNormalized;
}
