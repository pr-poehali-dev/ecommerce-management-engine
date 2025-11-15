import React from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface WebStoreHeaderProps {
  domain: string;
  onPreview: () => void;
  onPublish: () => void;
  loading: boolean;
}

const WebStoreHeader: React.FC<WebStoreHeaderProps> = ({
  domain,
  onPreview,
  onPublish,
  loading
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold gradient-text">Мой интернет-магазин</h2>
        <p className="text-muted-foreground mt-1">
          Создайте и управляйте своим собственным интернет-магазином
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPreview}>
          <Icon name="Eye" className="mr-2 h-4 w-4" />
          Предпросмотр
        </Button>
        <Button onClick={onPublish} disabled={loading}>
          <Icon name="Rocket" className="mr-2 h-4 w-4" />
          Опубликовать
        </Button>
      </div>
    </div>
  );
};

export default WebStoreHeader;
