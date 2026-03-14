import type {
  ExchangeDetailVM,
  InspectorDocument,
  ProviderId,
} from "../../shared/contracts";
import { ExchangeRepository } from "../storage/exchange-repository";
import type { ProviderCatalog } from "../providers/provider-catalog";

export class ExchangeQueryService {
  constructor(
    private readonly exchangeRepository: ExchangeRepository,
    private readonly providerCatalog: ProviderCatalog,
  ) {}

  async getExchangeDetail(exchangeId: string): Promise<ExchangeDetailVM | null> {
    const row = this.exchangeRepository.getById(exchangeId);
    if (!row) {
      return null;
    }

    const providerId = row.provider_id as ProviderId;
    const provider = this.providerCatalog.get(providerId);
    const normalized = JSON.parse(row.normalized_json as string) as {
      model: string | null;
    };
    const inspector = JSON.parse(row.inspector_json as string) as InspectorDocument;

    return {
      exchangeId: row.exchange_id,
      providerId,
      providerLabel: provider?.label ?? providerId,
      method: row.method,
      path: row.path,
      statusCode: row.status_code,
      durationMs: row.duration_ms,
      model: normalized.model ?? null,
      inspector,
    };
  }
}
