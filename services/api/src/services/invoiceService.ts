import { PrismaClient, InvoiceStatus } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface InvoiceItem {
  name: string;
  amount: number;
  tax?: number;
  total: number;
  quantity?: number;
}

interface BillingAddress {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
}

interface CreateInvoiceOptions {
  paymentId: string;
  vendorId?: string;
  customerId?: string;
  items: InvoiceItem[];
  billingAddress?: BillingAddress;
  notes?: string;
}

class InvoiceService {
  /**
   * Generate invoice HTML template
   */
  private generateInvoiceHTML(invoice: any): string {
    const currentDate = new Date().toLocaleDateString('en-IN');
    const issueDate = new Date(invoice.issueDate).toLocaleDateString('en-IN');
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : null;
    const paidDate = invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('en-IN') : null;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #f97316;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #f97316;
        }
        .invoice-title {
            text-align: right;
            color: #666;
        }
        .invoice-number {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .billing-info, .payment-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f97316;
        }
        .info-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
            font-size: 16px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .items-table th {
            background-color: #f97316;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .items-table tr:hover {
            background-color: #f1f3f4;
        }
        .amount {
            text-align: right;
            font-weight: 500;
        }
        .totals {
            margin-left: auto;
            width: 300px;
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        .total-row.final {
            border-top: 2px solid #f97316;
            padding-top: 15px;
            margin-top: 15px;
            font-weight: bold;
            font-size: 18px;
            color: #f97316;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }
        .status-overdue {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
            text-align: center;
        }
        .notes {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #6c757d;
        }
        @media print {
            body { margin: 0; padding: 10px; }
            .header { page-break-inside: avoid; }
            .items-table { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">GrabtoGo</div>
        <div class="invoice-title">
            <div class="invoice-number">INVOICE</div>
            <div>${invoice.invoiceNumber}</div>
        </div>
    </div>

    <div class="invoice-details">
        <div class="billing-info">
            <div class="info-title">Bill To:</div>
            ${invoice.billingAddress ? `
                <div><strong>${invoice.billingAddress.name}</strong></div>
                <div>${invoice.billingAddress.email}</div>
                ${invoice.billingAddress.phone ? `<div>${invoice.billingAddress.phone}</div>` : ''}
                ${invoice.billingAddress.address ? `<div>${invoice.billingAddress.address}</div>` : ''}
                ${invoice.billingAddress.city ? `<div>${invoice.billingAddress.city}, ${invoice.billingAddress.state || ''} ${invoice.billingAddress.pincode || ''}</div>` : ''}
                ${invoice.billingAddress.gstin ? `<div><strong>GSTIN:</strong> ${invoice.billingAddress.gstin}</div>` : ''}
            ` : '<div>Billing information not available</div>'}
        </div>

        <div class="payment-info">
            <div class="info-title">Invoice Details:</div>
            <div><strong>Issue Date:</strong> ${issueDate}</div>
            ${dueDate ? `<div><strong>Due Date:</strong> ${dueDate}</div>` : ''}
            ${paidDate ? `<div><strong>Paid Date:</strong> ${paidDate}</div>` : ''}
            <div><strong>Status:</strong>
                <span class="status-badge ${invoice.status.toLowerCase() === 'paid' ? 'status-paid' : invoice.status.toLowerCase() === 'overdue' ? 'status-overdue' : 'status-pending'}">
                    ${invoice.status}
                </span>
            </div>
            ${invoice.payment?.razorpayPaymentId ? `<div><strong>Payment ID:</strong> ${invoice.payment.razorpayPaymentId}</div>` : ''}
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Amount</th>
                <th style="text-align: right;">Tax</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            ${invoice.items.map((item: InvoiceItem) => `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align: center;">${item.quantity || 1}</td>
                    <td class="amount">₹${item.amount.toFixed(2)}</td>
                    <td class="amount">₹${(item.tax || 0).toFixed(2)}</td>
                    <td class="amount">₹${item.total.toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Tax (GST 18%):</span>
            <span>₹${invoice.taxAmount.toFixed(2)}</span>
        </div>
        <div class="total-row final">
            <span>Total Amount:</span>
            <span>₹${invoice.totalAmount.toFixed(2)}</span>
        </div>
    </div>

    ${invoice.description ? `
        <div class="notes">
            <div class="info-title">Notes:</div>
            <div>${invoice.description}</div>
        </div>
    ` : ''}

    <div class="footer">
        <p><strong>GrabtoGo Marketplace</strong></p>
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
        <p>Generated on: ${currentDate}</p>
    </div>
</body>
</html>`;
  }

  /**
   * Create and save invoice
   */
  async createInvoice(options: CreateInvoiceOptions) {
    try {
      const { paymentId, vendorId, customerId, items, billingAddress, notes } = options;

      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          vendor: { include: { user: true } },
          customer: { include: { user: true } },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Generate invoice number
      const timestamp = Date.now();
      const invoiceNumber = `GTG-${timestamp}`;

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = items.reduce((sum, item) => sum + (item.tax || 0), 0);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Create invoice record
      const invoice = await prisma.invoice.create({
        data: {
          paymentId,
          vendorId,
          customerId,
          invoiceNumber,
          status: payment.status === 'SUCCESS' ? InvoiceStatus.PAID : InvoiceStatus.SENT,
          issueDate: new Date(),
          dueDate: payment.status !== 'SUCCESS' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days from now
          paidDate: payment.paidAt,
          subtotal,
          taxAmount,
          totalAmount,
          currency: payment.currency,
          description: notes || payment.description,
          items,
          billingAddress,
          metadata: {
            paymentType: payment.paymentType,
            razorpayPaymentId: payment.razorpayPaymentId,
          },
        },
        include: {
          payment: true,
          vendor: { include: { user: true } },
          customer: { include: { user: true } },
        },
      });

      // Generate HTML content
      const htmlContent = this.generateInvoiceHTML(invoice);

      // Save HTML file (in production, you might want to store this in cloud storage)
      const invoicesDir = path.join(process.cwd(), 'storage', 'invoices');
      await fs.mkdir(invoicesDir, { recursive: true });

      const htmlFilePath = path.join(invoicesDir, `${invoiceNumber}.html`);
      await fs.writeFile(htmlFilePath, htmlContent, 'utf8');

      // Update invoice with file path
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          pdfUrl: `/invoices/${invoiceNumber}.html`, // This would be a PDF URL in production
        },
      });

      return {
        success: true,
        invoice: updatedInvoice,
        htmlContent,
      };
    } catch (error) {
      console.error('Create invoice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payment: true,
          vendor: { include: { user: true } },
          customer: { include: { user: true } },
        },
      });

      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found',
        };
      }

      return {
        success: true,
        invoice,
      };
    } catch (error) {
      console.error('Get invoice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get invoice HTML content
   */
  async getInvoiceHTML(invoiceId: string) {
    try {
      const result = await this.getInvoice(invoiceId);
      if (!result.success || !result.invoice) {
        return result;
      }

      const invoice = result.invoice;
      const htmlContent = this.generateInvoiceHTML(invoice);

      return {
        success: true,
        htmlContent,
        invoice,
      };
    } catch (error) {
      console.error('Get invoice HTML error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
    try {
      const invoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status,
          paidDate: status === InvoiceStatus.PAID ? new Date() : null,
        },
      });

      return {
        success: true,
        invoice,
      };
    } catch (error) {
      console.error('Update invoice status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get invoices for vendor/customer
   */
  async getInvoices(vendorId?: string, customerId?: string, limit = 10, offset = 0) {
    try {
      const where: any = {};
      if (vendorId) where.vendorId = vendorId;
      if (customerId) where.customerId = customerId;

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          payment: true,
          vendor: { include: { user: true } },
          customer: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.invoice.count({ where });

      return {
        success: true,
        invoices,
        total,
        hasMore: offset + invoices.length < total,
      };
    } catch (error) {
      console.error('Get invoices error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

const invoiceService = new InvoiceService();
export { InvoiceService, invoiceService };