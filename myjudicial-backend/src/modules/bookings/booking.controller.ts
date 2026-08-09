import { getErrorMessage } from "../../shared/utils/i18n-messages.js";
import { Request, Response, NextFunction } from "express";
import { BookingService } from "./booking.service.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import type { CreateBookingDto, UpdateBookingDto, AdminListBookingsQuery, AdminRefundDto, AdminStatsQuery } from "./booking.schemas.js";
import { BookingStatus, PaymentStatus } from "../../generated/prisma/client.js";


//getting all bookings for the user
export const BookingController = {
  listBookings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as BookingStatus | undefined;

      const result = await BookingService.listBookings({
        userId,
        role: req.user?.role,
        expertProfileId: req.user?.expertProfileId,
        page,
        limit,
        status,
      });

      res.status(200).json({
        success: true,
        data: result.bookings,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /bookings/:id
   */
  getBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const booking = await BookingService.getBookingById(id, userId);

      if (!booking) {
        throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
      }

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings
   * Create a new booking and initiate Mobile Money payment (Azam Pay)
   */
  createBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const dto: CreateBookingDto = req.body;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

     const { booking, payment } = await BookingService.createBooking({...dto, citizenId: userId });
      
      res.status(201).json({
        success: true,
        data: {
          booking,
          payment,  
        },
        message: "Booking created. Proceed to Mobile Money payment.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /bookings/:id
   * Update booking details (status, notes, etc.)
   */
  updateBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const dto: UpdateBookingDto = req.body;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const booking = await BookingService.updateBooking(id, userId, {
        ...dto,
        status: dto.status as BookingStatus | undefined,
      });

      if (!booking) {
        throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
      }

      // Write audit log
      await writeAuditLog({
        actorId: userId,
        action: "UPDATE",
        resource: "BOOKING",
        resourceId: id,
        description: `Updated booking: ${JSON.stringify(dto)}`,
      });

      res.status(200).json({
        success: true,
        data: booking,
        message: "Booking updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:id/cancel
   * Cancel a booking and process refund if applicable
   */
  cancelBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { reason } = req.body;
      const booking = await BookingService.cancelBooking(id, userId, reason);

      if (!booking) {
        throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
      }

      // Write audit log
      await writeAuditLog({
        actorId: userId,
        action: "CANCEL",
        resource: "BOOKING",
        resourceId: id,
        description: `Cancelled booking`,
      });

      res.status(200).json({
        success: true,
        data: booking,
        message: "Booking cancelled successfully.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:id/confirm
   * Admin-only manual override to confirm a booking whose Mobile Money
   * payment was verified out-of-band. Real payment confirmations flow
   * through the Azam Pay webhook (POST /payments/webhook).
   */
  confirmBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { paymentReference } = req.body;

      if (!paymentReference) {
        throw new ValidationError(getErrorMessage('REQUIRED_FIELD_MISSING'));
      }

      const booking = await BookingService.confirmBooking(id, paymentReference);

      if (!booking) {
        throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
      }

      res.status(200).json({
        success: true,
        data: booking,
        message: "Booking confirmed. Video consultation link will be sent shortly.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /bookings/expert/:id/slots
   * Get available time slots for an expert on a specific date
   */
  getExpertSlots: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string; // expert ID
      // date/serviceId are already validated by validateQuery(getAvailableSlotsSchema)
      const date = (req.validatedQuery?.date ?? req.query.date) as string;
      const serviceId = (req.validatedQuery?.serviceId ?? req.query.serviceId) as string | undefined;

      if (!date) {
        throw new ValidationError(getErrorMessage('REQUIRED_FIELD_MISSING'));
      }

      const slots = await BookingService.getAvailableSlots(id, date, serviceId);

      res.status(200).json({
        success: true,
        data: {
          expertId: id,
          date,
          totalSlots: slots.length,
          slots,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:id/join
   * Generate a token to join the video consultation
   */
  joinConsultation: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const token = await BookingService.generateLiveKitToken(id, userId);

      res.status(200).json({
        success: true,
        data: { token },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/bookings
   */
  adminListBookings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = (req.validatedQuery ?? req.query) as unknown as AdminListBookingsQuery;
      const page = parseInt(query.page || "1") || 1;
      const limit = parseInt(query.limit || "10") || 10;

      const result = await BookingService.listAllBookings({
        expertId: query.expertId,
        citizenId: query.citizenId,
        status: query.status,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.bookings,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/bookings/stats
   */
  adminGetStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = (req.validatedQuery ?? req.query) as unknown as AdminStatsQuery;
      const stats = await BookingService.getBookingStats(query.dateFrom, query.dateTo);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/bookings/:id/complete
   */
  adminCompleteBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = req.params.id as string;
      const adminUserId = req.user?.id;

      if (!adminUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const booking = await BookingService.adminCompleteBooking(bookingId, adminUserId);

      res.status(200).json({
        success: true,
        data: booking,
        message: "Booking manually marked as completed by admin.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/bookings/:id/refund
   */
  adminRefundBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = req.params.id as string;
      const adminUserId = req.user?.id;
      const dto = req.body as AdminRefundDto;

      if (!adminUserId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await BookingService.adminRefundBooking(bookingId, adminUserId, dto.reason, dto.percentage);

      res.status(200).json({
        success: true,
        message: `Admin manually initiated ${dto.percentage}% refund.`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:id/retry-payment
   * Retry payment for a failed/expired booking
   */
  retryPayment: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { booking, payment } = await BookingService.retryPayment(id, userId, req.body);

      res.status(200).json({
        success: true,
        data: { booking, payment },
        message: "Payment retry initiated. Check your phone for the payment prompt.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:id/accept
   * Expert accepts a booking request (booking-first flow).
   */
  acceptBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const booking = await BookingService.acceptBooking(id, userId);

      res.status(200).json({
        success: true,
        data: booking,
        message: "Booking accepted. The client has been notified.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:id/reschedule
   */
  rescheduleBooking: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const result = await BookingService.rescheduleBooking(id, userId, role, req.body);

      res.status(200).json({
        success: true,
        data: result,
        message: "Reschedule request submitted. The other party will be notified.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:id/approve-reschedule
   */
  approveReschedule: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const result = await BookingService.approveReschedule(id, userId, role);

      res.status(200).json({
        success: true,
        data: result,
        message: "Reschedule approved",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /bookings/:id/decline-reschedule
   */
  declineReschedule: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId || !role) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const result = await BookingService.declineReschedule(id, userId, role, req.body?.reason);

      res.status(200).json({
        success: true,
        data: result,
        message: "Reschedule declined",
      });
    } catch (error) {
      next(error);
    }
  },
};
