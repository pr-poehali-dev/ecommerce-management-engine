import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Marketplace, marketplaceInfo } from './types';

interface MarketplaceCardProps {
  marketplace: Marketplace;
  formatMoney: (amount: number) => string;
  onOpenSettings: (marketplace: Marketplace) => void;
  onOpenConnect: (marketplaceName: string) => void;
  onSync: (id: number, name: string) => void;
  onView?: (marketplace: Marketplace) => void;
  syncing?: boolean;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  marketplace,
  formatMoney,
  onOpenSettings,
  onOpenConnect,
  onSync,
  onView,
  syncing = false
}) => {
  const slug = marketplace.slug || marketplace.name.toLowerCase();
  const info = marketplaceInfo[slug] || marketplaceInfo[marketplace.name] || {
    logo: '📦',
    color: 'gray',
    displayName: marketplace.name
  };

  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">{info.logo}</div>
          <div>
            <h3 className="font-semibold text-lg">{info.displayName}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                marketplace.is_connected
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-gray-500/10 text-gray-500'
              }`}
            >
              {marketplace.is_connected ? 'Подключен' : 'Не подключен'}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={() => onOpenSettings(marketplace)}
        >
          <Icon name="Settings" className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Товары</span>
          <span className="font-semibold">{marketplace.total_products || marketplace.products_count || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Заказы</span>
          <span className="font-semibold">{marketplace.total_orders || marketplace.orders_count || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Выручка</span>
          <span className="font-semibold">{formatMoney(marketplace.total_revenue || 0)}</span>
        </div>
      </div>

      {marketplace.is_connected && (
        <div className="mt-4 pt-4 border-t relative z-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Icon name="Clock" className="h-3 w-3" />
            <span>
              {marketplace.last_sync_at
                ? `Синхронизировано ${new Date(marketplace.last_sync_at).toLocaleString('ru-RU')}`
                : 'Не синхронизировано'}
            </span>
          </div>
          <div className="flex gap-2">
            {onView && (
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={() => onView(marketplace)}
              >
                <Icon name="Eye" className="mr-2 h-3 w-3" />
                Открыть
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onSync(marketplace.id, marketplace.slug || marketplace.name)}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Синхр...
                </>
              ) : (
                <>
                  <Icon name="RefreshCw" className="mr-2 h-3 w-3" />
                  Синхр
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!marketplace.is_connected && (
        <Button
          variant="outline"
          className="w-full mt-4 relative z-10"
          onClick={() => onOpenConnect(marketplace.slug || marketplace.name)}
        >
          Подключить
        </Button>
      )}
    </Card>
  );
};

export default MarketplaceCard;