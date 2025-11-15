import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { marketplaceInfo, CRM_API } from './types';

interface MarketplaceConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MarketplaceConnectDialog: React.FC<MarketplaceConnectDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('');
  const [credentials, setCredentials] = useState({
    apiKey: '',
    clientId: '',
    sellerId: ''
  });

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
        
        onOpenChange(false);
        setSelectedMarketplace('');
        setCredentials({ apiKey: '', clientId: '', sellerId: '' });
        
        setTimeout(() => {
          onSuccess();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
};

export default MarketplaceConnectDialog;
