import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface StoreSettings {
  storeId: string;
  storeName: string;
  domain: string;
  customDomain: string;
  status: string;
  theme: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

interface WebStoreSettingsFormProps {
  storeSettings: StoreSettings;
  setStoreSettings: (settings: StoreSettings) => void;
  themes: Theme[];
  selectedTheme: string;
  setSelectedTheme: (theme: string) => void;
  loading: boolean;
  onSave: () => void;
}

const WebStoreSettingsForm: React.FC<WebStoreSettingsFormProps> = ({
  storeSettings,
  setStoreSettings,
  themes,
  selectedTheme,
  setSelectedTheme,
  loading,
  onSave
}) => {
  return (
    <Card className="lg:col-span-2">
      <Tabs defaultValue="general">
        <CardHeader>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Общее</TabsTrigger>
            <TabsTrigger value="design">Дизайн</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent>
          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="storeName">Название магазина</Label>
                <Input
                  id="storeName"
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="domain">Адрес магазина</Label>
                <div className="flex gap-2">
                  <Input
                    id="domain"
                    value={storeSettings.domain}
                    disabled
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon">
                    <Icon name="Copy" className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ваш магазин будет доступен по этому адресу
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customDomain">Свой домен (опционально)</Label>
                <Input
                  id="customDomain"
                  placeholder="myshop.com"
                  value={storeSettings.customDomain}
                  onChange={(e) => setStoreSettings({ ...storeSettings, customDomain: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Подключите свой домен для профессионального вида
                </p>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={storeSettings.contact.email}
                    onChange={(e) => setStoreSettings({
                      ...storeSettings,
                      contact: { ...storeSettings.contact, email: e.target.value }
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={storeSettings.contact.phone}
                    onChange={(e) => setStoreSettings({
                      ...storeSettings,
                      contact: { ...storeSettings.contact, phone: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Адрес</Label>
                <Textarea
                  id="address"
                  value={storeSettings.contact.address}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings,
                    contact: { ...storeSettings.contact, address: e.target.value }
                  })}
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold">Выберите тему оформления</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`relative rounded-lg border-2 cursor-pointer transition-all p-4 ${
                      selectedTheme === theme.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {selectedTheme === theme.id && (
                      <Badge className="absolute top-2 right-2">Активна</Badge>
                    )}
                    <h5 className="font-semibold mb-1">{theme.name}</h5>
                    <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {theme.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <h4 className="font-semibold">Цветовая схема</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primary">Основной цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary"
                      type="color"
                      value={storeSettings.colors.primary}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        colors: { ...storeSettings.colors, primary: e.target.value }
                      })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={storeSettings.colors.primary}
                      disabled
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secondary">Вторичный цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary"
                      type="color"
                      value={storeSettings.colors.secondary}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        colors: { ...storeSettings.colors, secondary: e.target.value }
                      })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={storeSettings.colors.secondary}
                      disabled
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accent">Акцентный цвет</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent"
                      type="color"
                      value={storeSettings.colors.accent}
                      onChange={(e) => setStoreSettings({
                        ...storeSettings,
                        colors: { ...storeSettings.colors, accent: e.target.value }
                      })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={storeSettings.colors.accent}
                      disabled
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold">Способы оплаты</h4>
              <div className="space-y-3">
                {[
                  { id: 'card', label: 'Банковские карты', icon: 'CreditCard' },
                  { id: 'sbp', label: 'СБП (Система быстрых платежей)', icon: 'Smartphone' },
                  { id: 'yookassa', label: 'ЮКасса', icon: 'Wallet' }
                ].map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name={method.icon} size={20} />
                      <span className="font-medium">{method.label}</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>

              <Separator />

              <h4 className="font-semibold">Способы доставки</h4>
              <div className="space-y-3">
                {[
                  { id: 'courier', label: 'Курьерская доставка', icon: 'Bike' },
                  { id: 'pickup', label: 'Самовывоз', icon: 'MapPin' },
                  { id: 'cdek', label: 'СДЭК', icon: 'Package' }
                ].map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name={method.icon} size={20} />
                      <span className="font-medium">{method.label}</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="freeDelivery">Бесплатная доставка от (₽)</Label>
                <Input
                  id="freeDelivery"
                  type="number"
                  defaultValue="3000"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="seoTitle">SEO заголовок</Label>
                <Input
                  id="seoTitle"
                  value={storeSettings.seo.title}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings,
                    seo: { ...storeSettings.seo, title: e.target.value }
                  })}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  Оптимально: 50-60 символов
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="seoDescription">SEO описание</Label>
                <Textarea
                  id="seoDescription"
                  value={storeSettings.seo.description}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings,
                    seo: { ...storeSettings.seo, description: e.target.value }
                  })}
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Оптимально: 150-160 символов
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="keywords">Ключевые слова</Label>
                <Input
                  id="keywords"
                  value={storeSettings.seo.keywords}
                  onChange={(e) => setStoreSettings({
                    ...storeSettings,
                    seo: { ...storeSettings.seo, keywords: e.target.value }
                  })}
                  placeholder="магазин, товары, покупки"
                />
                <p className="text-xs text-muted-foreground">
                  Разделяйте запятыми
                </p>
              </div>
            </div>
          </TabsContent>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline">Отменить</Button>
            <Button onClick={onSave} disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default WebStoreSettingsForm;
