import React from 'react';
import Icon from '@/components/ui/icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import NotificationCenter from './NotificationCenter';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { t, language, setLanguage } = useLanguage();
  
  const menuItems = [
    { id: 'dashboard', icon: 'LayoutDashboard', label: t('dashboard') },
    { id: 'aiInsights', icon: 'Sparkles', label: t('aiInsights') },
    { id: 'automation', icon: 'Zap', label: t('automation') },
    { id: 'products', icon: 'Package', label: t('products') },
    { id: 'orders', icon: 'ShoppingCart', label: t('orders') },
    { id: 'customers', icon: 'Users', label: t('customers') },
    { id: 'marketplaces', icon: 'Globe', label: t('marketplaces') },
    { id: 'profile', icon: 'User', label: t('profile') }
  ];

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-card to-background border-r flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Icon name="Store" className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">SellHub</h1>
              <p className="text-xs text-muted-foreground">AI-Powered</p>
            </div>
          </div>
          <NotificationCenter />
        </div>

        <nav className="space-y-1 mb-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={language === 'ru' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setLanguage('ru')}
            >
              RU
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setLanguage('en')}
            >
              EN
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;