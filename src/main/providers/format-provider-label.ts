import type { ProviderId } from "../../shared/contracts";

export function formatProviderLabel(providerId: ProviderId): string {
  return providerId.charAt(0).toUpperCase() + providerId.slice(1);
}
