import express from 'express';
import { param, query, validationResult } from 'express-validator';
import { invoiceService } from '../services/invoiceService';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/invoices/:invoiceId
 * @desc Get invoice by ID
 * @access Private
 */
router.get(
  '/:invoiceId',
  requireAuth,
  [param('invoiceId').isString().notEmpty().withMessage('Invoice ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { invoiceId } = req.params;

      const result = await invoiceService.getInvoice(invoiceId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          invoice: result.invoice,
        },
      });
    } catch (error) {
      console.error('Get invoice error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/invoices/:invoiceId/html
 * @desc Get invoice HTML content
 * @access Private
 */
router.get(
  '/:invoiceId/html',
  requireAuth,
  [param('invoiceId').isString().notEmpty().withMessage('Invoice ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { invoiceId } = req.params;

      const result = await invoiceService.getInvoiceHTML(invoiceId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
        });
      }

      // Set HTML content type
      res.setHeader('Content-Type', 'text/html');
      res.send(result.htmlContent);
    } catch (error) {
      console.error('Get invoice HTML error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route GET /api/invoices
 * @desc Get invoices for vendor/customer
 * @access Private
 */
router.get(
  '/',
  requireAuth,
  [
    query('vendorId').optional().isString(),
    query('customerId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { vendorId, customerId, limit = 10, offset = 0 } = req.query;

      const result = await invoiceService.getInvoices(
        vendorId as string,
        customerId as string,
        limit as number,
        offset as number
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          invoices: result.invoices,
          total: result.total,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * @route PUT /api/invoices/:invoiceId/status
 * @desc Update invoice status
 * @access Private (Admin only)
 */
router.put(
  '/:invoiceId/status',
  requireAuth,
  // TODO: Add admin role check middleware
  [
    param('invoiceId').isString().notEmpty().withMessage('Invoice ID is required'),
    query('status')
      .isIn(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
      .withMessage('Valid status is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { invoiceId } = req.params;
      const { status } = req.body;

      const result = await invoiceService.updateInvoiceStatus(invoiceId, status);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          invoice: result.invoice,
        },
      });
    } catch (error) {
      console.error('Update invoice status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

export default router;