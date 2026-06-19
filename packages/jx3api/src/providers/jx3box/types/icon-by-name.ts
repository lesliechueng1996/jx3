import { buildItemIconUrl } from '../config';

/** Raw item entry from jx3box `icon/name` lookup. */
export interface Jx3boxIconItemRaw {
  iconID: number;
  Name: string;
}

/** Raw payload returned by jx3box `icon/name` endpoint. */
export interface Jx3boxIconByNameRaw {
  item: Jx3boxIconItemRaw[];
  buff: unknown[];
  skill: unknown[];
}

/** Normalized item icon used across the monorepo. */
export interface ItemIcon {
  iconId: number;
  name: string;
  iconUrl: string;
}

export function mapItemIcon(raw: Jx3boxIconItemRaw): ItemIcon {
  return {
    iconId: raw.iconID,
    name: raw.Name,
    iconUrl: buildItemIconUrl(raw.iconID),
  };
}
