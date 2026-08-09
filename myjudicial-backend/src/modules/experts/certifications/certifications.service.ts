import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { CertificationsRepository } from "./certifications.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { NotFoundError, AuthorizationError } from "../../../shared/errors/index.js";
import type { CreateCertificationDto, UpdateCertificationDto } from "./certifications.schemas.js";


export const CertificationsService = {
  getAll: async (userId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    return CertificationsRepository.findAllByExpertId(profile.id);
  },

  create: async (userId: string, dto: CreateCertificationDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    return CertificationsRepository.create(profile.id, dto);
  },

  update: async (userId: string, certId: string, dto: UpdateCertificationDto) => {
    const cert = await CertificationsRepository.findById(certId);
    if (!cert) throw new NotFoundError("Certification");

    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile || cert.expertId !== profile.id) {
      throw new AuthorizationError(getErrorMessage('UNAUTHORIZED'));
    }

    return CertificationsRepository.update(certId, dto);
  },

  delete: async (userId: string, certId: string) => {
    const cert = await CertificationsRepository.findById(certId);
    if (!cert) throw new NotFoundError("Certification");

    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile || cert.expertId !== profile.id) {
      throw new AuthorizationError(getErrorMessage('UNAUTHORIZED'));
    }

    await CertificationsRepository.delete(certId);
  },
};
