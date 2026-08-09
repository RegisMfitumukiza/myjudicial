import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { ServicesRepository } from "./services.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { NotFoundError, AuthorizationError, ConflictError } from "../../../shared/errors/index.js";
import type { CreateServiceDto, UpdateServiceDto } from "./services.schemas.js";


const DEFAULT_SERVICE_UNDELETABLE_MESSAGE =
  "The default Consultation service cannot be deleted — it's your guaranteed fallback so clients " +
  "can always book you. To stop clients booking it at certain times, set those hours as " +
  "unavailable on your Availability page instead.";

const DEFAULT_SERVICE_MUST_STAY_ACTIVE_MESSAGE =
  "The default Consultation service must stay active — it's your guaranteed fallback so clients " +
  "can always book you. Edit its price or duration instead, or set your unavailable hours on the " +
  "Availability page.";

export const ServicesService = {
  getAll: async (userId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    return ServicesRepository.findAllByExpertId(profile.id);
  },

  getPublicServices: async (expertId: string) => {
    return ServicesRepository.findAllByExpertId(expertId, true);
  },

  create: async (userId: string, dto: CreateServiceDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    return ServicesRepository.create(profile.id, dto);
  },

  /**
   * Auto-create a default "Consultation" service at profile creation so every
   * expert is immediately bookable, using the rate they set during onboarding.
   * Idempotent — safe to call more than once for the same expert.
   */
  ensureDefaultConsultationService: async (expertId: string, flatFee: number, currency: string) => {
    const existing = await ServicesRepository.findDefaultByExpertId(expertId);
    if (existing) return existing;

    return ServicesRepository.createDefault(expertId, {
      name: "Consultation",
      description: "Standard legal consultation session.",
      category: "consultation",
      deliveryMode: "VIDEO",
      durationMin: 60,
      flatFee,
      currency,
    });
  },

  /**
   * Sync the default Consultation service's price when the expert updates their
   * base consultation fee on the profile.
   */
  syncDefaultServicePrice: async (expertId: string, flatFee: number, currency: string) => {
    const defaultService = await ServicesRepository.findDefaultByExpertId(expertId);
    if (!defaultService) return;

    await ServicesRepository.update(defaultService.id, {
      flatFee,
      currency,
      isActive: true,
    });
  },

  update: async (userId: string, serviceId: string, dto: UpdateServiceDto) => {
    const service = await ServicesRepository.findById(serviceId);
    if (!service) throw new NotFoundError("Service");

    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile || service.expertId !== profile.id) {
      throw new AuthorizationError("You do not own this service");
    }

    if (service.isDefault && dto.isActive === false) {
      throw new ConflictError(DEFAULT_SERVICE_MUST_STAY_ACTIVE_MESSAGE);
    }

    return ServicesRepository.update(serviceId, dto);
  },

  reorder: async (userId: string, serviceIds: string[]) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));

    const updates = serviceIds.map((id, index) =>
      ServicesRepository.update(id, { sortOrder: index })
    );
    return Promise.all(updates);
  },

  delete: async (userId: string, serviceId: string) => {
    const service = await ServicesRepository.findById(serviceId);
    if (!service) throw new NotFoundError("Service");

    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile || service.expertId !== profile.id) {
      throw new AuthorizationError("You do not own this service");
    }

    if (service.isDefault) {
      throw new ConflictError(DEFAULT_SERVICE_UNDELETABLE_MESSAGE);
    }

    const hasBookings = await ServicesRepository.hasBookings(serviceId);
    if (hasBookings) {
      return ServicesRepository.update(serviceId, { isActive: false });
    }

    await ServicesRepository.delete(serviceId);
  },
};
