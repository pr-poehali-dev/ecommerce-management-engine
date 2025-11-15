import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Marketplace, CRM_API } from './marketplace/types';
import MarketplaceConnectDialog from './marketplace/MarketplaceConnectDialog';
import MarketplaceDetailView from './marketplace/MarketplaceDetailView';

const MarketplacesPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [connectDialog, setConnectDialog] = useState(false);
  const [selectedMarketplaceForConnect, setSelectedMarketplaceForConnect] = useState<Marketplace | null>(null);
  const [syncing, setSyncing] = useState<{[key: number]: boolean}>({});
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedMarketplace, setSelectedMarketplace] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    loadMarketplaces();
  }, []);

  const loadMarketplaces = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CRM_API}/?action=getMarketplaces`);
      const data = await response.json();
      
      if (data.marketplaces) {
        setMarketplaces(data.marketplaces);
      } else if (data.error) {
        console.error('API Error:', data.error);
        toast({
          title: 'Ошибка API',
          description: 'Не удалось загрузить маркетплейсы',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить маркетплейсы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleConnectClick = (marketplace: Marketplace) => {
    setSelectedMarketplaceForConnect(marketplace);
    setConnectDialog(true);
  };

  const handleConnectSuccess = async () => {
    setConnectDialog(false);
    setSelectedMarketplaceForConnect(null);
    await loadMarketplaces();
    toast({
      title: 'Успешно',
      description: 'Маркетплейс успешно подключен'
    });
  };

  const handleViewMarketplace = (marketplace: Marketplace) => {
    setSelectedMarketplace({ id: marketplace.id, name: marketplace.name });
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedMarketplace(null);
    loadMarketplaces();
  };

  const handleSync = async (marketplaceId: number, marketplaceName: string) => {
    setSyncing(prev => ({...prev, [marketplaceId]: true}));
    
    try {
      const response = await fetch(`${CRM_API}/?action=syncMarketplace&marketplaceId=${marketplaceId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok && !result.error) {
        toast({
          title: 'Синхронизация завершена',
          description: `${marketplaceName}: синхронизировано ${result.products || 0} товаров, ${result.orders || 0} заказов`
        });
        await loadMarketplaces();
      } else {
        toast({
          title: 'Ошибка синхронизации',
          description: result.error || 'Не удалось синхронизировать данные',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось синхронизировать маркетплейс',
        variant: 'destructive'
      });
    } finally {
      setSyncing(prev => ({...prev, [marketplaceId]: false}));
    }
  };

  const handleDisconnect = async (marketplaceId: number, marketplaceName: string) => {
    if (!confirm(`Отключить ${marketplaceName}?`)) return;

    try {
      const response = await fetch(`${CRM_API}/?action=disconnectMarketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplaceId })
      });

      if (response.ok) {
        toast({
          title: 'Отключено',
          description: `${marketplaceName} успешно отключен`
        });
        await loadMarketplaces();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отключить маркетплейс',
        variant: 'destructive'
      });
    }
  };

  if (viewMode === 'detail' && selectedMarketplace) {
    return (
      <MarketplaceDetailView
        marketplaceId={selectedMarketplace.id}
        marketplaceName={selectedMarketplace.name}
        onBack={handleBackToList}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка маркетплейсов...</p>
        </div>
      </div>
    );
  }

  const connectedMarketplaces = marketplaces.filter(m => m.is_connected);
  const availableMarketplaces = marketplaces.filter(m => !m.is_connected);

  return (
    <div className="space-y-8">
      {connectedMarketplaces.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Подключенные маркетплейсы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedMarketplaces.map(marketplace => (
              <Card key={marketplace.id} className="p-6 hover:shadow-lg transition-all border-2 border-green-500/20 bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {marketplace.logo_url && (
                      <img
                        src={marketplace.logo_url}
                        alt={marketplace.name}
                        className="w-12 h-12 rounded-lg object-contain bg-white p-2"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{marketplace.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Подключен
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{marketplace.total_products || 0}</p>
                    <p className="text-xs text-muted-foreground">Товаров</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{marketplace.total_orders || 0}</p>
                    <p className="text-xs text-muted-foreground">Заказов</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{formatMoney(marketplace.total_revenue || 0)}</p>
                    <p className="text-xs text-muted-foreground">Выручка</p>
                  </div>
                </div>

                {marketplace.last_sync_at && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Синхронизация: {new Date(marketplace.last_sync_at).toLocaleString('ru-RU')}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewMarketplace(marketplace)}
                    className="flex-1 gap-2"
                    variant="default"
                  >
                    <Icon name="ExternalLink" size={16} />
                    Открыть
                  </Button>
                  <Button
                    onClick={() => handleSync(marketplace.id, marketplace.name)}
                    variant="outline"
                    size="icon"
                    disabled={syncing[marketplace.id]}
                  >
                    <Icon name={syncing[marketplace.id] ? "Loader2" : "RefreshCw"} size={16} className={syncing[marketplace.id] ? "animate-spin" : ""} />
                  </Button>
                  <Button
                    onClick={() => handleDisconnect(marketplace.id, marketplace.name)}
                    variant="ghost"
                    size="icon"
                  >
                    <Icon name="Unplug" size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {availableMarketplaces.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Доступные маркетплейсы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableMarketplaces.map(marketplace => (
              <Card key={marketplace.id} className="p-6 hover:shadow-lg transition-all group cursor-pointer" onClick={() => handleConnectClick(marketplace)}>
                <div className="flex flex-col items-center text-center gap-3">
                  {marketplace.logo_url && (
                    <img
                      src={marketplace.logo_url}
                      alt={marketplace.name}
                      className="w-16 h-16 rounded-lg object-contain bg-muted p-3 group-hover:scale-110 transition-transform"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{marketplace.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Нажмите для подключения</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {marketplaces.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Icon name="Store" size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Нет доступных маркетплейсов</h3>
          <p className="text-muted-foreground">
            Данные загружаются...
          </p>
        </Card>
      )}

      {selectedMarketplaceForConnect && (
        <MarketplaceConnectDialog
          marketplace={selectedMarketplaceForConnect}
          open={connectDialog}
          onOpenChange={(open) => {
            setConnectDialog(open);
            if (!open) setSelectedMarketplaceForConnect(null);
          }}
          onSuccess={handleConnectSuccess}
        />
      )}
    </div>
  );
};

export default MarketplacesPanel;
