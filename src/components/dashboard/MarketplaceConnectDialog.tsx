import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import Icon from '@/components/ui/icon';

interface Marketplace {
  id: string;
  name: string;
  logo: string;
  country: string;
  connected: boolean;
}

interface MarketplaceConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketplace: Marketplace | null;
  onConnect: (marketplaceId: string, credentials: {
    apiKey: string;
    apiSecret: string;
    sellerId: string;
    storeUrl: string;
  }) => void;
}

const MarketplaceConnectDialog: React.FC<MarketplaceConnectDialogProps> = ({
  open,
  onOpenChange,
  marketplace,
  onConnect
}) => {
  const { t } = useLanguage();
  const [credentials, setCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    sellerId: '',
    storeUrl: ''
  });

  const handleSubmit = () => {
    if (marketplace) {
      onConnect(marketplace.id, credentials);
      setCredentials({ apiKey: '', apiSecret: '', sellerId: '', storeUrl: '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {marketplace && <img src={marketplace.logo} alt={marketplace.name} className="h-10 w-10 rounded" />}
            <div>
              <DialogTitle>{t('connectMarketplace')}: {marketplace?.name}</DialogTitle>
              <DialogDescription>{marketplace?.country}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Icon name="Key" size={16} />
              {t('apiKey')}
            </Label>
            <Input
              id="apiKey"
              value={credentials.apiKey}
              onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
              placeholder="sk_live_xxxxxxxxxxxxx"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="apiSecret" className="flex items-center gap-2">
              <Icon name="Lock" size={16} />
              {t('apiSecret')}
            </Label>
            <Input
              id="apiSecret"
              type="password"
              value={credentials.apiSecret}
              onChange={(e) => setCredentials({ ...credentials, apiSecret: e.target.value })}
              placeholder="••••••••••••••••"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="sellerId" className="flex items-center gap-2">
              <Icon name="User" size={16} />
              {t('sellerID')}
            </Label>
            <Input
              id="sellerId"
              value={credentials.sellerId}
              onChange={(e) => setCredentials({ ...credentials, sellerId: e.target.value })}
              placeholder="seller_123456"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="storeUrl" className="flex items-center gap-2">
              <Icon name="Globe" size={16} />
              {t('storeUrl')}
            </Label>
            <Input
              id="storeUrl"
              value={credentials.storeUrl}
              onChange={(e) => setCredentials({ ...credentials, storeUrl: e.target.value })}
              placeholder="https://store.marketplace.com/your-shop"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit}>
            <Icon name="Plug" className="mr-2 h-4 w-4" />
            {t('connect')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceConnectDialog;
