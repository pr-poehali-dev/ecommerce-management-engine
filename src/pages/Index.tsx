import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardTab from '@/components/dashboard/DashboardTab';
import ProductsTab from '@/components/dashboard/ProductsTab';
import OtherTabs from '@/components/dashboard/OtherTabs';

const API_URL = 'https://functions.poehali.dev/26680cc3-0053-45ae-ac6a-1c7a3c94505c';

interface IndexProps {
  onLogout: () => void;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  marketplace: string;
  date: string;
  status: 'processing' | 'shipped' | 'delivered';
  items: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
}

interface Marketplace {
  id: string;
  name: string;
  logo: string;
  country: string;
  connected: boolean;
}

interface Analytics {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
  revenueData: Array<{ name: string; revenue: number }>;
  ordersData: Array<{ name: string; orders: number; customers: number }>;
}

const Index: React.FC<IndexProps> = ({ onLogout }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', category: '', price: 0, stock: 0 });

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>('all');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    revenue: 0,
    orders: 0,
    products: 0,
    customers: 0,
    revenueData: [],
    ordersData: []
  });

  const [userInfo, setUserInfo] = useState({ email: '', name: '' });

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || email.split('@')[0];
    setUserInfo({ email, name });
  }, []);

  const fetchProducts = async (category: string = 'all') => {
    setLoading(true);
    try {
      const url = category === 'all' 
        ? `${API_URL}?path=products`
        : `${API_URL}?path=products&category=${encodeURIComponent(category)}`;
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data.products || []);
      if (data.categories) setCategories(data.categories);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (status: string = 'all') => {
    setLoading(true);
    try {
      const url = status === 'all'
        ? `${API_URL}?path=orders`
        : `${API_URL}?path=orders&status=${status}`;
      const response = await fetch(url);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=customers`);
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load customers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketplaces = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=marketplaces`);
      const data = await response.json();
      setMarketplaces(data.marketplaces || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load marketplaces', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') fetchProducts(selectedCategory);
    if (activeTab === 'orders') fetchOrders(orderStatus);
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'marketplaces') fetchMarketplaces();
    if (activeTab === 'dashboard') fetchAnalytics();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders(orderStatus);
  }, [orderStatus]);

  const handleAddProduct = async () => {
    try {
      const response = await fetch(`${API_URL}?path=products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Product added successfully' });
        setProductDialog(false);
        setProductForm({ name: '', description: '', category: '', price: 0, stock: 0 });
        fetchProducts(selectedCategory);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add product', variant: 'destructive' });
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const response = await fetch(`${API_URL}?path=products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, id: editingProduct?.id })
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Product updated successfully' });
        setProductDialog(false);
        setEditingProduct(null);
        setProductForm({ name: '', description: '', category: '', price: 0, stock: 0 });
        fetchProducts(selectedCategory);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`${API_URL}?path=products&id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'Success', description: 'Product deleted successfully' });
        fetchProducts(selectedCategory);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock
    });
    setProductDialog(true);
  };

  const handleConnectMarketplace = (marketplaceName: string) => {
    toast({ title: 'Info', description: `Connecting to ${marketplaceName}...` });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab 
              analytics={analytics} 
              orders={orders} 
              products={products} 
              customers={customers} 
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              loading={loading}
              productDialog={productDialog}
              setProductDialog={setProductDialog}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
              productForm={productForm}
              setProductForm={setProductForm}
              handleAddProduct={handleAddProduct}
              handleUpdateProduct={handleUpdateProduct}
              handleDeleteProduct={handleDeleteProduct}
              openEditDialog={openEditDialog}
            />
          )}

          {(activeTab === 'orders' || activeTab === 'customers' || activeTab === 'marketplaces' || activeTab === 'profile') && (
            <OtherTabs
              activeTab={activeTab}
              orders={orders}
              orderStatus={orderStatus}
              setOrderStatus={setOrderStatus}
              customers={customers}
              marketplaces={marketplaces}
              userInfo={userInfo}
              handleConnectMarketplace={handleConnectMarketplace}
              onLogout={onLogout}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
