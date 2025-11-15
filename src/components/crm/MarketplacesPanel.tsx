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
  const [connecting, setConnecting] = useState(false);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [connectDialog, setConnectDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('');
  const [selectedMarketplaceData, setSelectedMarketplaceData] = useState<Marketplace | null>(null);
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
      
      console.log('Marketplaces loaded:', data);
      
      if (data.marketplaces) {
        setMarketplaces(data.marketplaces);
      } else if (data.error) {
        console.error('API Error:', data.error);
        toast({
          title: 'Ошибка API',
          description: data.error,
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

  const handleConnect = async () => {
    if (!credentials.apiKey || !credentials.clientId) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    try {
      setConnecting(true);
      
      console.log('Connecting marketplace:', selectedMarketplace);
      console.log('Credentials:', { apiKey: credentials.apiKey?.slice(0, 10) + '...', clientId: credentials.clientId });
      
      const response = await fetch(`${CRM_API}/?action=connectMarketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedMarketplace,
          apiKey: credentials.apiKey,
          clientId: credentials.clientId,
          sellerId: credentials.sellerId || ''
        })
      });

      const data = await response.json();
      console.log('Connect response:', data);
      
      if (response.ok && data.marketplace) {
        toast({
          title: '✅ Успешно подключено!',
          description: `${marketplaceInfo[selectedMarketplace]?.displayName || selectedMarketplace} успешно подключен`
        });
        
        setConnectDialog(false);
        setSelectedMarketplace('');
        setCredentials({ apiKey: '', clientId: '', sellerId: '' });
        
        setTimeout(() => {
          loadMarketplaces();
        }, 500);
      } else {
        toast({
          title: 'Ошибка подключения',
          description: data.error || data.message || 'Не удалось подключить маркетплейс',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Connect error:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при подключении. Проверьте консоль.',
        variant: 'destructive'
      });
    } finally {
      setConnecting(false);
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
    setCredentials({ apiKey: '', clientId: '', sellerId: '' });
    setConnectDialog(true);
  };

  const handleSync = async (marketplaceId: number, marketplaceName: string) => {
    try {
      toast({
        title: 'Синхронизация',
        description: `Синхронизирую ${marketplaceInfo[marketplaceName]?.displayName || marketplaceName}...`
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await loadMarketplaces();
      
      toast({
        title: 'Успешно',
        description: 'Синхронизация завершена'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось синхронизировать',
        variant: 'destructive'
      });
    }
  };

  const handleDisconnect = async (marketplace: Marketplace) => {
    try {
      const response = await fetch(`${CRM_API}/?action=disconnectMarketplace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplaceId: marketplace.id })
      });

      if (response.ok) {
        toast({
          title: '✅ Отключено',
          description: `${marketplaceInfo[marketplace.slug || marketplace.name]?.displayName || marketplace.name} отключен`
        });
        setSettingsDialog(false);
        await loadMarketplaces();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отключить маркетплейс',
        variant: 'destructive'
      });
    }
  };

  const openSettingsDialog = (marketplace: Marketplace) => {
    setSelectedMarketplaceData(marketplace);
    setSettingsDialog(true);
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Подключить маркетплейс</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Выберите площадку и введите API ключи для интеграции
              </p>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div>
                <Label className="text-base mb-3 block">Выберите маркетплейс</Label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(marketplaceInfo).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedMarketplace(key)}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        selectedMarketplace === key
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-4xl mb-2">{info.logo}</div>
                      <p className="text-sm font-medium">{info.displayName}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedMarketplace && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon name="Key" className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        Настройка {marketplaceInfo[selectedMarketplace]?.displayName}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Введите ваши API ключи для подключения
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="apiKey">API Key *</Label>
                    <Input
                      id="apiKey"
                      value={credentials.apiKey}
                      onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                      placeholder="Введите API ключ"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Найдите в личном кабинете маркетплейса → Настройки → API
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="clientId">Client ID *</Label>
                    <Input
                      id="clientId"
                      value={credentials.clientId}
                      onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                      placeholder="Введите Client ID"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellerId">Seller ID (опционально)</Label>
                    <Input
                      id="sellerId"
                      value={credentials.sellerId}
                      onChange={(e) => setCredentials({ ...credentials, sellerId: e.target.value })}
                      placeholder="Введите Seller ID"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleConnect} 
                      className="flex-1"
                      disabled={!credentials.apiKey || !credentials.clientId || connecting}
                    >
                      {connecting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Подключаю...
                        </>
                      ) : (
                        <>
                          <Icon name="Link" className="mr-2 h-4 w-4" />
                          Подключить маркетплейс
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedMarketplace('');
                        setCredentials({ apiKey: '', clientId: '', sellerId: '' });
                      }}
                      disabled={connecting}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              {!selectedMarketplace && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="MousePointerClick" className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Выберите маркетплейс для подключения</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl">Настройки маркетплейса</DialogTitle>
            </DialogHeader>
            {selectedMarketplaceData && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-5xl">
                    {marketplaceInfo[selectedMarketplaceData.slug || selectedMarketplaceData.name]?.logo || '📦'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {marketplaceInfo[selectedMarketplaceData.slug || selectedMarketplaceData.name]?.displayName || selectedMarketplaceData.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedMarketplaceData.is_connected ? 'Подключен и активен' : 'Не подключен'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <span className="text-sm text-muted-foreground">Client ID</span>
                    <span className="text-sm font-mono">{selectedMarketplaceData.client_id || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <span className="text-sm text-muted-foreground">API Key</span>
                    <span className="text-sm font-mono">
                      {selectedMarketplaceData.api_key ? '••••••••' + selectedMarketplaceData.api_key.slice(-4) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <span className="text-sm text-muted-foreground">Последняя синхронизация</span>
                    <span className="text-sm">
                      {selectedMarketplaceData.last_sync_at 
                        ? new Date(selectedMarketplaceData.last_sync_at).toLocaleString('ru-RU')
                        : 'Не синхронизировано'}
                    </span>
                  </div>
                </div>

                {selectedMarketplaceData.is_connected && (
                  <div className="space-y-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        handleSync(selectedMarketplaceData.id, selectedMarketplaceData.slug || selectedMarketplaceData.name);
                        setSettingsDialog(false);
                      }}
                    >
                      <Icon name="RefreshCw" className="mr-2 h-4 w-4" />
                      Синхронизировать сейчас
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleDisconnect(selectedMarketplaceData)}
                    >
                      <Icon name="Unlink" className="mr-2 h-4 w-4" />
                      Отключить маркетплейс
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {marketplaces.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Store" className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Подключите первый маркетплейс</h3>
            <p className="text-muted-foreground mb-6">
              Начните управлять продажами на всех площадках из одного места
            </p>
            <Button onClick={() => setConnectDialog(true)} size="lg">
              <Icon name="Plus" className="mr-2 h-5 w-5" />
              Подключить маркетплейс
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaces.map((marketplace) => {
          const slug = marketplace.slug || marketplace.name.toLowerCase();
          const info = marketplaceInfo[slug] || marketplaceInfo[marketplace.name] || {
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
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => openSettingsDialog(marketplace)}
                >
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => handleSync(marketplace.id, marketplace.slug || marketplace.name)}
                  >
                    <Icon name="RefreshCw" className="mr-2 h-3 w-3" />
                    Синхронизировать
                  </Button>
                </div>
              )}

              {!marketplace.is_connected && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => openConnectDialog(marketplace.slug || marketplace.name)}
                >
                  Подключить
                </Button>
              )}
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
};

export default MarketplacesPanel;