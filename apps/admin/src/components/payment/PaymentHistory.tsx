'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Receipt,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  paymentType: 'REGISTRATION_FEE' | 'SUBSCRIPTION' | 'ORDER_PAYMENT' | 'REFUND';
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  amount: number;
  tax?: number;
  totalAmount: number;
  currency: string;
  description?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  failedAt?: string;
  refundedAt?: string;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    pdfUrl?: string;
  };
  subscription?: {
    id: string;
    planType: string;
  };
}

interface PaymentHistoryProps {
  payments: Payment[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onViewInvoice?: (invoiceId: string) => void;
  onDownloadInvoice?: (invoiceId: string) => void;
  onRefresh?: () => void;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  loading = false,
  onLoadMore,
  hasMore = false,
  onViewInvoice,
  onDownloadInvoice,
  onRefresh,
}) => {
  const getStatusBadge = (status: Payment['status']) => {
    const statusConfig = {
      PENDING: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
      PROCESSING: { variant: 'default' as const, icon: RefreshCw, label: 'Processing' },
      SUCCESS: { variant: 'success' as const, icon: CheckCircle, label: 'Completed' },
      FAILED: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' },
      CANCELLED: { variant: 'outline' as const, icon: XCircle, label: 'Cancelled' },
      REFUNDED: { variant: 'outline' as const, icon: RefreshCw, label: 'Refunded' },
      PARTIALLY_REFUNDED: { variant: 'warning' as const, icon: AlertCircle, label: 'Partially Refunded' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentTypeLabel = (type: Payment['paymentType']) => {
    const typeLabels = {
      REGISTRATION_FEE: 'Registration Fee',
      SUBSCRIPTION: 'Subscription',
      ORDER_PAYMENT: 'Order Payment',
      REFUND: 'Refund',
    };
    return typeLabels[type];
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment History</h2>
          <p className="text-muted-foreground">
            View all your payment transactions and invoices
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      {payments.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Payment History</h3>
            <p className="text-muted-foreground text-center">
              You haven't made any payments yet. Once you make a payment, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {payment.description || getPaymentTypeLabel(payment.paymentType)}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {payment.paidAt
                            ? format(new Date(payment.paidAt), 'MMM dd, yyyy HH:mm')
                            : format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>

                      {payment.razorpayPaymentId && (
                        <div>
                          <span className="font-medium">Payment ID:</span>{' '}
                          {payment.razorpayPaymentId}
                        </div>
                      )}

                      {payment.subscription && (
                        <div>
                          <span className="font-medium">Plan:</span>{' '}
                          {payment.subscription.planType}
                        </div>
                      )}
                    </div>

                    {payment.status === 'FAILED' && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                        <p className="text-sm text-destructive">
                          Payment failed. Please try again or contact support.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formatCurrency(payment.totalAmount, payment.currency)}
                    </div>
                    {payment.tax && payment.tax > 0 && (
                      <div className="text-sm text-muted-foreground">
                        (incl. ₹{payment.tax.toFixed(2)} GST)
                      </div>
                    )}
                  </div>
                </div>

                {payment.invoice && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Receipt className="w-4 h-4" />
                        <span>Invoice: {payment.invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onViewInvoice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewInvoice(payment.invoice!.id)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        )}
                        {onDownloadInvoice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDownloadInvoice(payment.invoice!.id)}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}

          {hasMore && onLoadMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loading}
                className="min-w-32"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;