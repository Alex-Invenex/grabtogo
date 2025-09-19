import { Request, Response, NextFunction } from 'express'
import promClient from 'prom-client'

// Create a Registry
const register = new promClient.Registry()

// Add default metrics
promClient.collectDefaultMetrics({ register })

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
})

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

const activeConnections = new promClient.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections'
})

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
})

const dbConnectionsTotal = new promClient.Gauge({
  name: 'db_connections_total',
  help: 'Number of database connections'
})

// Business metrics
const ordersTotal = new promClient.Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['status', 'vendor_id']
})

const paymentsTotal = new promClient.Counter({
  name: 'payments_total',
  help: 'Total number of payments',
  labelNames: ['status', 'method']
})

const revenueTotal = new promClient.Counter({
  name: 'revenue_total',
  help: 'Total revenue in rupees',
  labelNames: ['vendor_id']
})

const userRegistrationsTotal = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total user registrations',
  labelNames: ['role']
})

const vendorsActive = new promClient.Gauge({
  name: 'vendors_active',
  help: 'Number of active vendors'
})

const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type']
})

const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type']
})

// Register metrics
register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestsTotal)
register.registerMetric(activeConnections)
register.registerMetric(dbQueryDuration)
register.registerMetric(dbConnectionsTotal)
register.registerMetric(ordersTotal)
register.registerMetric(paymentsTotal)
register.registerMetric(revenueTotal)
register.registerMetric(userRegistrationsTotal)
register.registerMetric(vendorsActive)
register.registerMetric(cacheHits)
register.registerMetric(cacheMisses)

/**
 * Middleware to collect HTTP request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  // Increment active connections
  activeConnections.inc()

  // Override end method to capture metrics
  const originalEnd = res.end
  res.end = function(...args: any[]) {
    const duration = (Date.now() - start) / 1000
    const route = req.route?.path || req.path
    const method = req.method
    const statusCode = res.statusCode.toString()

    // Record metrics
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration)

    httpRequestsTotal
      .labels(method, route, statusCode)
      .inc()

    // Decrement active connections
    activeConnections.dec()

    // Call original end method
    originalEnd.apply(res, args)
  }

  next()
}

/**
 * Metrics endpoint
 */
export async function metricsEndpoint(req: Request, res: Response) {
  try {
    res.set('Content-Type', register.contentType)
    const metrics = await register.metrics()
    res.end(metrics)
  } catch (error) {
    res.status(500).end('Error generating metrics')
  }
}

/**
 * Business metrics helpers
 */
export const Metrics = {
  // Order metrics
  recordOrder: (status: string, vendorId: string) => {
    ordersTotal.labels(status, vendorId).inc()
  },

  // Payment metrics
  recordPayment: (status: string, method: string) => {
    paymentsTotal.labels(status, method).inc()
  },

  // Revenue metrics
  recordRevenue: (amount: number, vendorId: string) => {
    revenueTotal.labels(vendorId).inc(amount)
  },

  // User registration metrics
  recordUserRegistration: (role: string) => {
    userRegistrationsTotal.labels(role).inc()
  },

  // Vendor metrics
  updateActiveVendors: (count: number) => {
    vendorsActive.set(count)
  },

  // Cache metrics
  recordCacheHit: (cacheType: string) => {
    cacheHits.labels(cacheType).inc()
  },

  recordCacheMiss: (cacheType: string) => {
    cacheMisses.labels(cacheType).inc()
  },

  // Database metrics
  recordDbQuery: (operation: string, table: string, duration: number) => {
    dbQueryDuration.labels(operation, table).observe(duration)
  },

  updateDbConnections: (count: number) => {
    dbConnectionsTotal.set(count)
  }
}

/**
 * Health check metrics
 */
export const healthMetrics = new promClient.Gauge({
  name: 'service_health',
  help: 'Health status of various services',
  labelNames: ['service']
})

register.registerMetric(healthMetrics)

export const HealthMetrics = {
  setServiceHealth: (service: string, isHealthy: boolean) => {
    healthMetrics.labels(service).set(isHealthy ? 1 : 0)
  }
}

// Export the registry for custom metrics
export { register }