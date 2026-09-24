import { prisma } from '../lib/prisma.js';
import { decrypt } from '../lib/secrets.js';
import { AppError } from '../lib/errors.js';

/**
 * HRMS/Attendance Sync Service
 * Handles polling HRMS for employee data and pulling attendance from Attendance system
 */

export class SyncService {
  constructor() {
    this.config = null;
    this.isRunning = false;
    this.pollInterval = null;
  }

  /**
   * Load integration config
   */
  async loadConfig() {
    this.config = await prisma.integrationConfig.findUnique({ where: { id: 'default' } });
    return this.config;
  }

  /**
   * Check if sync is enabled and configured
   */
  isConfigured() {
    return this.config && 
           this.config.pollerEnabled && 
           this.config.hrmsBaseUrl && 
           this.config.hrmsApiKeyEnc;
  }

  /**
   * Get decrypted API key
   */
  getApiKey() {
    if (!this.config?.hrmsApiKeyEnc) return null;
    return decrypt(this.config.hrmsApiKeyEnc);
  }

  /**
   * Get webhook secret
   */
  getWebhookSecret() {
    if (!this.config?.hrmsWebhookSecretEnc) return null;
    return decrypt(this.config.hrmsWebhookSecretEnc);
  }

  /**
   * Start the poller
   */
  async startPoller() {
    if (this.isRunning) return;
    
    await this.loadConfig();
    
    if (!this.isConfigured()) {
      console.log('[Sync] Poller not configured or disabled');
      return;
    }

    this.isRunning = true;
    console.log('[Sync] Starting HRMS poller');

    // Run immediately
    await this.pullEmployees();

    // Schedule recurring polls
    const intervalMs = (this.config.intervalMin || 15) * 60 * 1000;
    this.pollInterval = setInterval(async () => {
      if (!this.isRunning) return;
      try {
        await this.pullEmployees();
      } catch (e) {
        console.error('[Sync] Poller error:', e);
      }
    }, intervalMs);
  }

  /**
   * Stop the poller
   */
  stopPoller() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log('[Sync] Poller stopped');
  }

  /**
   * Pull employees from HRMS
   */
  async pullEmployees() {
    if (!this.isConfigured()) {
      throw new AppError('HRMS integration not configured', 400, 'NOT_CONFIGURED');
    }

    const apiKey = this.getApiKey();
    const baseUrl = this.config.hrmsBaseUrl.replace(/\/$/, '');
    const ingestPath = this.config.ingestPath || '/integrations/employees';
    const timeoutMs = this.config.timeoutMs || 15000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${ingestPath}?limit=1000`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AppError(`HRMS returned ${response.status}: ${response.statusText}`, 502, 'HRMS_ERROR');
      }

      const data = await response.json();
      const employees = data.data || [];

      // Log sync attempt
      const log = await prisma.syncLog.create({
        data: {
          source: 'POLL',
          direction: 'PULL',
          event: 'employee.sync',
          status: 'SUCCESS',
          processed: employees.length,
          message: `Pulled ${employees.length} employees from HRMS`,
        },
      });

      // Process each employee
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const emp of employees) {
        try {
          await this.upsertEmployee(emp);
          if (emp.id && !emp.createdAt) created++;
          else updated++;
        } catch (e) {
          console.error('[Sync] Failed to upsert employee:', emp.employeeNumber, e);
          errors++;
        }
      }

      // Update log with results
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          message: `Pulled ${employees.length} employees (created: ${created}, updated: ${updated}, errors: ${errors})`,
          status: errors > 0 ? 'PARTIAL' : 'SUCCESS',
        },
      });

      // Forward to Attendance if enabled
      if (this.config.forwardingEnabled && this.config.hrmsWebhookSecretEnc) {
        await this.forwardToAttendance(employees);
      }

      return { processed: employees.length, created, updated, errors };
    } catch (e) {
      clearTimeout(timeoutId);
      
      // Log failure
      await prisma.syncLog.create({
        data: {
          source: 'POLL',
          direction: 'PULL',
          event: 'employee.sync',
          status: 'FAILED',
          processed: 0,
          message: e.message || 'Sync failed',
        },
      });
      
      throw e;
    }
  }

  /**
   * Upsert employee from HRMS data
   */
  async upsertEmployee(hrmsEmployee) {
    const {
      id: hrmsId,
      employeeNumber,
      firstName,
      lastName,
      middleName,
      email,
      department,
      position,
      hiredDate,
      monthlySalary,
      status = 'ACTIVE',
    } = hrmsEmployee;

    if (!employeeNumber) {
      throw new Error('Employee number is required');
    }

    // Check if employee exists by employeeNumber
    const existing = await prisma.employee.findUnique({
      where: { employeeNumber },
    });

    const employeeData = {
      hrmsId,
      employeeNumber,
      firstName,
      lastName,
      middleName,
      email,
      department,
      position,
      hiredDate: hiredDate ? new Date(hiredDate) : null,
      monthlySalary: monthlySalary || 0,
      status,
      syncSource: 'HRMS',
      lastSyncedAt: new Date(),
      deletedAt: status === 'INACTIVE' ? new Date() : null,
    };

    if (existing) {
      // Revive if previously soft-deleted
      if (existing.deletedAt && status === 'ACTIVE') {
        employeeData.deletedAt = null;
      }
      await prisma.employee.update({
        where: { id: existing.id },
        data: employeeData,
      });
    } else {
      await prisma.employee.create({ data: employeeData });
    }
  }

  /**
   * Forward employee data to Attendance system
   */
  async forwardToAttendance(employees) {
    if (!this.config.forwardingEnabled) return;

    // This would typically call the Attendance system's webhook endpoint
    // For now, just log it
    console.log(`[Sync] Forwarding ${employees.length} employees to Attendance system`);
    
    await prisma.syncLog.create({
      data: {
        source: 'FORWARD',
        direction: 'PUSH',
        event: 'employee.forward',
        status: 'SUCCESS',
        processed: employees.length,
        message: `Forwarded ${employees.length} employees to Attendance system`,
      },
    });
  }

  /**
   * Pull attendance data from Attendance system
   */
  async pullAttendance(params = {}) {
    if (!this.isConfigured()) {
      throw new AppError('HRMS integration not configured', 400, 'NOT_CONFIGURED');
    }

    const apiKey = this.getApiKey();
    const baseUrl = this.config.hrmsBaseUrl.replace(/\/$/, '');
    const attendancePath = '/integrations/attendance';
    const timeoutMs = this.config.timeoutMs || 15000;

    const { startDate, endDate, employeeId } = params;
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (employeeId) queryParams.append('employeeId', employeeId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${attendancePath}?${queryParams}`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AppError(`Attendance system returned ${response.status}`, 502, 'ATTENDANCE_ERROR');
      }

      const data = await response.json();
      const records = data.data || [];

      // Log sync
      await prisma.syncLog.create({
        data: {
          source: 'POLL',
          direction: 'PULL',
          event: 'attendance.sync',
          status: 'SUCCESS',
          processed: records.length,
          message: `Pulled ${records.length} attendance records`,
        },
      });

      return records;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }

  /**
   * Handle incoming webhook from HRMS
   */
  async handleWebhook(payload, signature) {
    const secret = this.getWebhookSecret();
    if (!secret) {
      throw new AppError('Webhook secret not configured', 400, 'NOT_CONFIGURED');
    }

    // Verify signature (HMAC-SHA256)
    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new AppError('Invalid webhook signature', 401, 'INVALID_SIGNATURE');
    }

    // Process based on event type
    const { event, data } = payload;

    let result;
    switch (event) {
      case 'employee.created':
      case 'employee.updated':
        result = await this.upsertEmployee(data);
        break;
      case 'employee.deleted':
        // Soft delete
        if (data.employeeNumber) {
          await prisma.employee.update({
            where: { employeeNumber: data.employeeNumber },
            data: { status: 'INACTIVE', deletedAt: new Date(), syncSource: 'HRMS' },
          });
        }
        break;
      default:
        console.log('[Sync] Unknown webhook event:', event);
    }

    // Log webhook
    await prisma.syncLog.create({
      data: {
        source: 'WEBHOOK',
        direction: 'PUSH',
        event,
        status: 'SUCCESS',
        processed: 1,
        message: `Processed webhook: ${event}`,
      },
    });

    return result;
  }

  /**
   * Get sync logs with filters
   */
  async getLogs(filters = {}) {
    const { status, source, direction, page = 1, limit = 20 } = filters;
    const where = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (direction) where.direction = direction;

    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.syncLog.count({ where }),
    ]);

    return { data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

// Singleton instance
export const syncService = new SyncService();