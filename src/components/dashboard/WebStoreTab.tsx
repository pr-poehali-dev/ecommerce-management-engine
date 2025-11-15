import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const WEBSTORE_API = 'https://functions.poehali.dev/a088ac42-044b-465b-9291-e546fa248863';

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

const WebStoreTab: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('modern');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadStoreSettings();
    loadThemes();
    loadAnalytics();
  }, []);

  const loadStoreSettings = async () => {
    try {
      const response = await fetch(`${WEBSTORE_API}?action=getSettings`);
      const data = await response.json();
      setStoreSettings(data);
      setSelectedTheme(data.theme);
    } catch (error) {
      console.error('Error loading store settings:', error);
    }
  };

  const loadThemes = async () => {
    try {
      const response = await fetch(`${WEBSTORE_API}?action=getThemes`);
      const data = await response.json();
      setThemes(data.themes);
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${WEBSTORE_API}?action=getAnalytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!storeSettings) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${WEBSTORE_API}?action=updateSettings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeSettings)
      });
      
      if (response.ok) {
        toast({ title: 'Успешно', description: 'Настройки сохранены' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить настройки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!storeSettings) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${WEBSTORE_API}?action=publishStore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: storeSettings.storeId })
      });
      
      const data = await response.json();
      if (response.ok) {
        toast({ 
          title: '🎉 Магазин опубликован!', 
          description: `Доступен по адресу: ${data.url}` 
        });
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось опубликовать магазин', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!storeSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Мой интернет-магазин</h2>
          <p className="text-muted-foreground mt-1">
            Создайте и управляйте своим собственным интернет-магазином
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`https://${storeSettings.domain}`, '_blank')}>
            <Icon name="Eye" className="mr-2 h-4 w-4" />
            Предпросмотр
          </Button>
          <Button onClick={handlePublish} disabled={loading}>
            <Icon name="Rocket" className="mr-2 h-4 w-4" />
            Опубликовать
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
                <Button onClick={handleSaveSettings} disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </CardContent>
          </Tabs>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="BarChart3" className="text-blue-600" />
                Статистика магазина
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics && (
                <>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Посетители сегодня</div>
                    <div className="text-2xl font-bold">{analytics.visitors?.today}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Заказы сегодня</div>
                    <div className="text-2xl font-bold">{analytics.orders?.today}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Выручка сегодня</div>
                    <div className="text-2xl font-bold">
                      {analytics.revenue?.today.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Конверсия</div>
                    <div className="text-2xl font-bold">{analytics.conversion?.rate}%</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статус магазина</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Статус</span>
                  <Badge className="bg-green-600">
                    {storeSettings.status === 'published' ? 'Опубликован' : 'Черновик'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Тема</span>
                  <span className="text-sm font-medium">{selectedTheme}</span>
                </div>
                <Separator />
                <Button variant="outline" className="w-full" onClick={handlePublish}>
                  <Icon name="ExternalLink" className="mr-2 h-4 w-4" />
                  Открыть магазин
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WebStoreTab;
