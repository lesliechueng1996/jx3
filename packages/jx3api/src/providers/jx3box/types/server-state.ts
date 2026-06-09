/** Raw payload returned by jx3box spider `server_state` endpoint. */
export interface Jx3boxServerStateRaw {
  zone_name: string;
  server_name: string;
  ip_address: string;
  ip_port: string;
  channel: string;
  connect_state: boolean;
  heat: string;
  maintain_time: number;
  delay: number;
  main_server: string;
}

/** Normalized server state used across the monorepo. */
export interface GameServerState {
  zoneName: string;
  serverName: string;
  ipAddress: string;
  ipPort: string;
  channel: string;
  connectState: boolean;
  heat: string;
  maintainTime: number;
  delay: number;
  mainServer: string;
}

export function mapServerState(raw: Jx3boxServerStateRaw): GameServerState {
  return {
    zoneName: raw.zone_name,
    serverName: raw.server_name,
    ipAddress: raw.ip_address,
    ipPort: raw.ip_port,
    channel: raw.channel,
    connectState: raw.connect_state,
    heat: raw.heat,
    maintainTime: raw.maintain_time,
    delay: raw.delay,
    mainServer: raw.main_server,
  };
}
