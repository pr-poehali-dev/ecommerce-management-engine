import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const CRM_API = 'https://functions.poehali.dev/c04a2bd5-728d-4b71-866a-189e7a5acb5c';

interface Marketplace {
  id: number;
  name: string;
  api_key: string | null;
  client_id: string | null;
  is_connected: boolean;
  products_count: number;
  orders_count: number;
  total_revenue: number;
  last_sync_at: string | null;
}

const marketplaceInfo: Record<string, { logo: string; color: string; displayName: string }> = {
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

const MarketplacesPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [connectDialog, setConnectDialog] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('');
  const [credentials, setCredentials] = useState({
    apiKey: '',
    clientId: '',
    sellerId: ''
  });

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
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить маркетплейсы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch(`${CRM_API}/?action=connectMarketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedMarketplace,
          ...credentials
        })
      });

      const data = await response.json();
      
      if (data.marketplace) {
        toast({
          title: 'Успешно',
          description: data.message || 'Маркетплейс подключен'
        });
        setConnectDialog(false);
        setCredentials({ apiKey: '', clientId: '', sellerId: '' });
        loadMarketplaces();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключить маркетплейс',
        variant: 'destructive'
      });
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openConnectDialog = (marketplaceName: string) => {
    setSelectedMarketplace(marketplaceName);
    setConnectDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Маркетплейсы</h2>
          <p className="text-muted-foreground mt-1">
            Управление подключениями и синхронизацией
          </p>
        </div>
        <Dialog open={connectDialog} onOpenChange={setConnectDialog}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Подключить маркетплейс
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подключить маркетплейс</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(marketplaceInfo).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMarketplace(key)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedMarketplace === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{info.logo}</div>
                    <p className="text-xs font-medium">{info.displayName}</p>
                  </button>
                ))}
              </div>

              {selectedMarketplace && (
                <>
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                      placeholder="Введите API ключ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      value={credentials.clientId}
                      onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                      placeholder="Введите Client ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellerId">Seller ID (опционально)</Label>
                    <Input
                      id="sellerId"
                      value={credentials.sellerId}
                      onChange={(e) => setCredentials({ ...credentials, sellerId: e.target.value })}
                      placeholder="Введите Seller ID"
                    />
                  </div>
                  <Button onClick={handleConnect} className="w-full">
                    Подключить
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketplaces.map((marketplace) => {
          const info = marketplaceInfo[marketplace.name] || {
            logo: '📦',
            color: 'gray',
            displayName: marketplace.name
          };

          return (
            <Card key={marketplace.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{info.logo}</div>
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
                <Button variant="ghost" size="sm">
                  <Icon name="Settings" className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Товары</span>
                  <span className="font-semibold">{marketplace.products_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Заказы</span>
                  <span className="font-semibold">{marketplace.orders_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Выручка</span>
                  <span className="font-semibold">{formatMoney(marketplace.total_revenue || 0)}</span>
                </div>
              </div>

              {marketplace.is_connected && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="Clock" className="h-3 w-3" />
                    <span>
                      {marketplace.last_sync_at
                        ? `Синхронизировано ${new Date(marketplace.last_sync_at).toLocaleString('ru-RU')}`
                        : 'Не синхронизировано'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <Icon name="RefreshCw" className="mr-2 h-3 w-3" />
                    Синхронизировать
                  </Button>
                </div>
              )}

              {!marketplace.is_connected && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => openConnectDialog(marketplace.name)}
                >
                  Подключить
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MarketplacesPanel;
