import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import AnalyticsPanel from '@/components/crm/AnalyticsPanel';
import MarketplacesPanel from '@/components/crm/MarketplacesPanel';
import ProductsPanel from '@/components/crm/ProductsPanel';
import OrdersPanel from '@/components/crm/OrdersPanel';
import AIToolsPanel from '@/components/crm/AIToolsPanel';
import UnitEconomicsPanel from '@/components/crm/UnitEconomicsPanel';
import CRMHeader from '@/components/crm/dashboard/CRMHeader';
import DashboardContent from '@/components/crm/dashboard/DashboardContent';
import NotificationsDialog from '@/components/crm/dashboard/NotificationsDialog';
import SettingsDialog from '@/components/crm/dashboard/SettingsDialog';
import { 
  DashboardStats, 
  RecentOrder, 
  LowStockProduct, 
  CRM_API,
  formatMoney,
  formatDate,
  getStatusColor,
  getStatusText
} from '@/components/crm/dashboard/types';

const CRMDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('crm_active_tab') || 'dashboard';
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('crm_settings');
    return saved ? JSON.parse(saved) : {
      companyName: 'Интернет-магазин',
      email: '',
      currency: 'RUB',
      notifyOrders: true,
      notifyStock: true,
      emailReports: false
    };
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    localStorage.setItem('crm_active_tab', activeTab);
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CRM_API}/?action=getDashboard`);
      const data = await response.json();
      
      if (data.stats) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setLowStockProducts(data.lowStockProducts || []);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные дашборда',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('crm_settings', JSON.stringify(settings));
    toast({
      title: 'Настройки сохранены',
      description: 'Ваши настройки успешно обновлены'
    });
    setSettingsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Загрузка CRM системы...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CRMHeader
        onRefresh={loadDashboard}
        onNotificationsToggle={() => setNotificationsOpen(!notificationsOpen)}
        onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
      />

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <Icon name="LayoutDashboard" className="h-4 w-4" />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="marketplaces" className="gap-2">
              <Icon name="Store" className="h-4 w-4" />
              Маркетплейсы
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Icon name="Package" className="h-4 w-4" />
              Товары
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Icon name="ShoppingCart" className="h-4 w-4" />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="LineChart" className="h-4 w-4" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="gap-2">
              <Icon name="Brain" className="h-4 w-4" />
              AI Инструменты
            </TabsTrigger>
            <TabsTrigger value="unit-economics" className="gap-2">
              <Icon name="Calculator" className="h-4 w-4" />
              Юнит-экономика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardContent
              stats={stats}
              recentOrders={recentOrders}
              lowStockProducts={lowStockProducts}
              onTabChange={setActiveTab}
              formatMoney={formatMoney}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          </TabsContent>

          <TabsContent value="marketplaces">
            <MarketplacesPanel />
          </TabsContent>

          <TabsContent value="products">
            <ProductsPanel />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersPanel />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsPanel />
          </TabsContent>

          <TabsContent value="ai-tools">
            <AIToolsPanel />
          </TabsContent>

          <TabsContent value="unit-economics">
            <UnitEconomicsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <NotificationsDialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default CRMDashboard;
