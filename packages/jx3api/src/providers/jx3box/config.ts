export const JX3BOX_SPIDER_BASE_URL = 'https://spider2.jx3box.com/api/spider';
export const JX3BOX_NODE_BASE_URL = 'https://node.jx3box.com';
export const JX3BOX_ICON_CDN_BASE_URL = 'https://icon.jx3box.com/icon';

export function buildItemIconUrl(iconId: number): string {
  return `${JX3BOX_ICON_CDN_BASE_URL}/${iconId}.png`;
}
