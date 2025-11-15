export interface Marketplace {
  id: number;
  name: string;
  slug?: string;
  logo_url?: string;
  country?: string;
  api_key: string | null;
  client_id: string | null;
  is_connected: boolean;
  products_count: number;
  orders_count: number;
  total_revenue: number;
  last_sync_at: string | null;
}

export const marketplaceInfo: Record<string, { logo: string; color: string; displayName: string }> = {
  wildberries: {
    logo: '🟣',
    color: 'purple',
    displayName: 'Wildberries'
  },
  ozon: {
    logo: '🔵',
    color: 'blue',
    displayName: 'Ozon'
  },
  yandex_market: {
    logo: '🟡',
    color: 'yellow',
    displayName: 'Яндекс Маркет'
  },
  aliexpress: {
    logo: '🔴',
    color: 'red',
    displayName: 'AliExpress'
  },
  sber: {
    logo: '🟢',
    color: 'green',
    displayName: 'СберМегамаркет'
  },
  kazanexpress: {
    logo: '🟠',
    color: 'orange',
    displayName: 'KazanExpress'
  }
};

export const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';
