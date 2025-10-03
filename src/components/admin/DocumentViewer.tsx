'use client';

import React, { useState } from 'react';
import { FileText, Download, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DocumentViewerProps {
  url: string;
  name: string;
  type?: 'pdf' | 'image';
  children?: React.ReactNode;
  className?: string;
}

export default function DocumentViewer({
  url,
  name,
  type = 'pdf',
  children,
  className = '',
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const renderContent = () => {
    if (type === 'pdf') {
      return (
        <div className="w-full h-[70vh] bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title={name}
          />
        </div>
      );
    }

    // Image viewer with zoom and rotation
    return (
      <div className="w-full h-[70vh] bg-gray-900 rounded-lg overflow-auto flex items-center justify-center">
        <img
          src={url}
          alt={name}
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease',
          }}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className={className}>
            <FileText className="w-4 h-4 mr-2" />
            View {name}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{name}</DialogTitle>
              <DialogDescription>
                {type === 'pdf' ? 'PDF Document' : 'Image Document'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {type === 'image' && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-12 text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRotate}
                    title="Rotate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    title="Reset"
                  >
                    Reset
                  </Button>
                </>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4">
          {renderContent()}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
