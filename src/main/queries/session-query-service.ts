import type {
  NormalizedBlock,
  NormalizedExchange,
  ProtocolAdapter,
  ProviderId,
  SessionListFilter,
  SessionListItemVM,
  SessionTraceVM,
} from "../../shared/contracts";
import { ExchangeRepository } from "../storage/exchange-repository";
import {
  SessionRepository,
  type SessionRow,
} from "../storage/session-repository";
import type { ProviderCatalog } from "../providers/provider-catalog";

export class SessionQueryService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly exchangeRepository: ExchangeRepository,
    private readonly providerCatalog: ProviderCatalog,
    private readonly protocolAdapters: Map<string, ProtocolAdapter>,
  ) {}

  private mapSessionRow(row: SessionRow): SessionListItemVM {
    const providerId = row.provider_id as ProviderId;
    const provider = this.providerCatalog.get(providerId);
    return {
      sessionId: row.session_id,
      providerId,
      providerLabel: provider?.label ?? providerId,
      profileId: row.profile_id,
      title: row.title,
      model: row.model,
      updatedAt: row.updated_at,
      exchangeCount: row.exchange_count,
    };
  }

  getSessionListItem(sessionId: string): SessionListItemVM {
    const row = this.sessionRepository.getById(sessionId);
    if (!row) {
      throw new Error(`Unknown session: ${sessionId}`);
    }
    return this.mapSessionRow(row);
  }

  async listSessions(
    filter?: SessionListFilter,
  ): Promise<SessionListItemVM[]> {
    const sessions = this.sessionRepository
      .listSessions()
      .map((row) => this.mapSessionRow(row));

    if (!filter) {
      return sessions;
    }

    return sessions.filter((session) => {
      if (filter.providerId && session.providerId !== filter.providerId) {
        return false;
      }
      if (filter.profileId && session.profileId !== filter.profileId) {
        return false;
      }
      if (!filter.query) {
        return true;
      }

      const query = filter.query.toLowerCase();
      return (
        session.title.toLowerCase().includes(query) ||
        session.providerLabel.toLowerCase().includes(query) ||
        (session.model?.toLowerCase().includes(query) ?? false)
      );
    });
  }

  async getSessionTrace(sessionId: string): Promise<SessionTraceVM> {
    const session = this.sessionRepository.getById(sessionId);
    if (!session) {
      throw new Error(`Unknown session: ${sessionId}`);
    }

    const providerId = session.provider_id as ProviderId;
    const provider = this.providerCatalog.get(providerId);
    if (!provider) {
      throw new Error(`Unknown provider for session: ${providerId}`);
    }

    const adapter = this.protocolAdapters.get(provider.protocolAdapterId);
    if (!adapter) {
      throw new Error(`Missing adapter: ${provider.protocolAdapterId}`);
    }

    const exchanges = this.exchangeRepository.listBySessionId(sessionId);
    const normalizedExchanges = exchanges.map((row) =>
      JSON.parse(row.normalized_json as string),
    ) as NormalizedExchange[];

    const instructions: NormalizedBlock[] =
      normalizedExchanges.length > 0
        ? (normalizedExchanges[0].request.instructions ?? [])
        : [];

    return {
      sessionId: session.session_id,
      providerId,
      providerLabel: provider.label,
      profileId: session.profile_id,
      title: session.title,
      instructions,
      timeline: adapter.timelineAssembler.build(normalizedExchanges),
      exchanges: exchanges.map((row) => {
        const normalized = JSON.parse(row.normalized_json as string) as {
          model: string | null;
        };
        return {
          exchangeId: row.exchange_id,
          providerId,
          providerLabel: provider.label,
          method: row.method,
          path: row.path,
          statusCode: row.status_code,
          durationMs: row.duration_ms,
          model: normalized.model ?? null,
        };
      }),
    };
  }
}
