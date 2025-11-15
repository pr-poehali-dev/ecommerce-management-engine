import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface ProfileTabProps {
  onLogout: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ onLogout }) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'security' | 'billing'>('account');

  const [profile, setProfile] = useState({
    name: 'Александр Петров',
    email: 'a.petrov@sellhub.com',
    phone: '+7 (999) 123-45-67',
    company: 'SellHub Enterprises',
    timezone: 'Europe/Moscow'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailOrders: true,
    emailPayments: true,
    emailStock: false,
    pushOrders: true,
    pushPayments: true,
    pushStock: true,
    smsOrders: false,
    smsPayments: false
  });

  const sections = [
    { id: 'account', icon: 'User', label: t('accountSettings') },
    { id: 'notifications', icon: 'Bell', label: t('notifications') },
    { id: 'security', icon: 'Shield', label: t('security') },
    { id: 'billing', icon: 'CreditCard', label: t('billing') }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">{t('profile')}</h2>
          <p className="text-muted-foreground mt-1">
            Управление вашим аккаунтом и настройками
          </p>
        </div>
        <Button variant="destructive" onClick={onLogout}>
          <Icon name="LogOut" className="mr-2 h-4 w-4" />
          {t('logout')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-2xl">
                  АП
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{profile.name}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600">
                  Premium
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon name={section.icon} size={18} />
                  <span className="font-medium text-sm">{section.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          {activeSection === 'account' && (
            <>
              <CardHeader>
                <CardTitle>{t('userInformation')}</CardTitle>
                <CardDescription>
                  Обновите информацию вашего профиля
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t('name')}</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">{t('company')}</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Настройки интерфейса</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('language')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Выберите язык интерфейса
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={language === 'ru' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLanguage('ru')}
                      >
                        RU
                      </Button>
                      <Button
                        variant={language === 'en' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLanguage('en')}
                      >
                        EN
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('theme')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {theme === 'dark' ? t('darkTheme') : t('lightTheme')}
                      </p>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('timezone')}</Label>
                      <p className="text-sm text-muted-foreground">
                        Ваш часовой пояс
                      </p>
                    </div>
                    <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="Europe/Moscow">Москва (GMT+3)</option>
                      <option value="Europe/London">Лондон (GMT+0)</option>
                      <option value="America/New_York">Нью-Йорк (GMT-5)</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <Button className="w-full">{t('update')}</Button>
              </CardContent>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <CardHeader>
                <CardTitle>{t('notifications')}</CardTitle>
                <CardDescription>
                  Настройте, как вы хотите получать уведомления
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Icon name="Mail" size={18} />
                    Email уведомления
                  </h4>
                  {[
                    { key: 'emailOrders', label: 'Новые заказы' },
                    { key: 'emailPayments', label: 'Платежи' },
                    { key: 'emailStock', label: 'Остатки товаров' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label htmlFor={item.key}>{item.label}</Label>
                      <Switch
                        id={item.key}
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Icon name="Bell" size={18} />
                    Push уведомления
                  </h4>
                  {[
                    { key: 'pushOrders', label: 'Новые заказы' },
                    { key: 'pushPayments', label: 'Платежи' },
                    { key: 'pushStock', label: 'Остатки товаров' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label htmlFor={item.key}>{item.label}</Label>
                      <Switch
                        id={item.key}
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Icon name="Smartphone" size={18} />
                    SMS уведомления
                  </h4>
                  {[
                    { key: 'smsOrders', label: 'Новые заказы' },
                    { key: 'smsPayments', label: 'Платежи' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <Label htmlFor={item.key}>{item.label}</Label>
                      <Switch
                        id={item.key}
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>

                <Button className="w-full">{t('save')}</Button>
              </CardContent>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <CardHeader>
                <CardTitle>{t('security')}</CardTitle>
                <CardDescription>
                  Управление безопасностью вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Изменить пароль</h4>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="currentPassword">Текущий пароль</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">Новый пароль</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                  </div>
                  <Button>Обновить пароль</Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Двухфакторная аутентификация</h4>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name="ShieldCheck" className="text-green-600" size={24} />
                      <div>
                        <p className="font-medium">2FA включена</p>
                        <p className="text-sm text-muted-foreground">
                          Дополнительная защита вашего аккаунта
                        </p>
                      </div>
                    </div>
                    <Switch checked={true} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Активные сессии</h4>
                  <div className="space-y-2">
                    {[
                      { device: 'Chrome на Windows', location: 'Москва, Россия', active: true },
                      { device: 'Safari на iPhone', location: 'Москва, Россия', active: false }
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon name="Monitor" size={20} />
                          <div>
                            <p className="font-medium text-sm">{session.device}</p>
                            <p className="text-xs text-muted-foreground">{session.location}</p>
                          </div>
                        </div>
                        {session.active && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Активна
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {activeSection === 'billing' && (
            <>
              <CardHeader>
                <CardTitle>{t('billing')}</CardTitle>
                <CardDescription>
                  Управление подпиской и платежными методами
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 border rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">Premium План</h4>
                      <p className="text-sm text-muted-foreground">Активна до 15 марта 2026</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                      Активна
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold">4,990 ₽</span>
                    <span className="text-muted-foreground">/месяц</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Управление подпиской
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Платежные методы</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon name="CreditCard" size={20} />
                        <div>
                          <p className="font-medium text-sm">•••• 4242</p>
                          <p className="text-xs text-muted-foreground">Истекает 12/26</p>
                        </div>
                      </div>
                      <Badge variant="outline">По умолчанию</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Icon name="Plus" className="mr-2 h-4 w-4" />
                    Добавить карту
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">История платежей</h4>
                  <div className="space-y-2">
                    {[
                      { date: '1 февр 2025', amount: '4,990 ₽', status: 'Успешно' },
                      { date: '1 янв 2025', amount: '4,990 ₽', status: 'Успешно' },
                      { date: '1 дек 2024', amount: '4,990 ₽', status: 'Успешно' }
                    ].map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <span className="text-muted-foreground">{payment.date}</span>
                        <span className="font-medium">{payment.amount}</span>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfileTab;
