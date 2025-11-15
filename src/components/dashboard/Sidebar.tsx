import React from 'react';
import Icon from '@/components/ui/icon';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
    { id: 'products', icon: 'Package', label: 'Products' },
    { id: 'orders', icon: 'ShoppingCart', label: 'Orders' },
    { id: 'customers', icon: 'Users', label: 'Customers' },
    { id: 'marketplaces', icon: 'Globe', label: 'Marketplaces' },
    { id: 'profile', icon: 'User', label: 'Profile' }
  ];

  return (
    <aside className="w-64 min-h-screen bg-card border-r">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Icon name="Store" className="text-primary-foreground" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">SellHub</h1>
            <p className="text-xs text-muted-foreground">E-commerce Platform</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
