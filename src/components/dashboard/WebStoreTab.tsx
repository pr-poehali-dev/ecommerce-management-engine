import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import WebStoreHeader from './webstore/WebStoreHeader';
import WebStoreSettingsForm from './webstore/WebStoreSettingsForm';
import WebStoreSidebar from './webstore/WebStoreSidebar';

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

  const handlePreview = () => {
    if (storeSettings) {
      window.open(`https://${storeSettings.domain}`, '_blank');
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
      <WebStoreHeader
        domain={storeSettings.domain}
        onPreview={handlePreview}
        onPublish={handlePublish}
        loading={loading}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <WebStoreSettingsForm
          storeSettings={storeSettings}
          setStoreSettings={setStoreSettings}
          themes={themes}
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
          loading={loading}
          onSave={handleSaveSettings}
        />

        <WebStoreSidebar
          status={storeSettings.status}
          selectedTheme={selectedTheme}
          analytics={analytics}
          onPublish={handlePublish}
        />
      </div>
    </div>
  );
};

export default WebStoreTab;
