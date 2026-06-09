/** Raw server detail payload from jx3api `master/search` endpoint. */
export interface Jx3apiMasterSearchDataRaw {
  id: string;
  center: string;
  zone: string;
  name: string;
  event: number;
  voice: Record<string, number[]>;
  alias: string[];
  slave: string[];
}

/** Envelope returned by jx3api.com APIs. */
export interface Jx3apiEnvelopeRaw<T> {
  code: number;
  msg: string;
  data: T;
  time: number;
}

/** Normalized game server detail used across the monorepo. */
export interface GameServerDetail {
  id: string;
  center: string;
  zone: string;
  name: string;
  event: number;
  voice: Record<string, number[]>;
  alias: string[];
  slaveServers: string[];
}

export function mapMasterSearchData(
  raw: Jx3apiMasterSearchDataRaw,
): GameServerDetail {
  return {
    id: raw.id,
    center: raw.center,
    zone: raw.zone,
    name: raw.name,
    event: raw.event,
    voice: raw.voice,
    alias: raw.alias,
    slaveServers: raw.slave,
  };
}
