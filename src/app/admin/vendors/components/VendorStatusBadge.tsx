'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface VendorStatusBadgeProps {
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';
  size?: 'sm' | 'md';
}

export default function VendorStatusBadge({ status, size = 'sm' }: VendorStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
          icon: CheckCircle,
          label: 'Active',
        };
      case 'PENDING':
        return {
          variant: 'default' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
          icon: Clock,
          label: 'Pending',
        };
      case 'SUSPENDED':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
          icon: XCircle,
          label: 'Suspended',
        };
      case 'INACTIVE':
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
          icon: AlertTriangle,
          label: 'Inactive',
        };
      default:
        return {
          variant: 'outline' as const,
          className: '',
          icon: AlertTriangle,
          label: status,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      <Icon className={`${iconSize} mr-1`} />
      {config.label}
    </Badge>
  );
}
