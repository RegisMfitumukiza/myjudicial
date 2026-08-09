import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { EducationRepository } from "./education.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { NotFoundError, AuthorizationError } from "../../../shared/errors/index.js";
import type { CreateEducationDto, UpdateEducationDto } from "./education.schemas.js";


export const EducationService = {
  getAll: async (userId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    return EducationRepository.findAllByExpertId(profile.id);
  },

  create: async (userId: string, dto: CreateEducationDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    return EducationRepository.create(profile.id, dto);
  },

  update: async (userId: string, educationId: string, dto: UpdateEducationDto) => {
    const record = await EducationRepository.findById(educationId);
    if (!record) throw new NotFoundError("Education record");

    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile || record.expertId !== profile.id) {
      throw new AuthorizationError(getErrorMessage('UNAUTHORIZED'));
    }

    return EducationRepository.update(educationId, dto);
  },

  delete: async (userId: string, educationId: string) => {
    const record = await EducationRepository.findById(educationId);
    if (!record) throw new NotFoundError("Education record");

    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile || record.expertId !== profile.id) {
      throw new AuthorizationError(getErrorMessage('UNAUTHORIZED'));
    }

    await EducationRepository.delete(educationId);
  },
};
