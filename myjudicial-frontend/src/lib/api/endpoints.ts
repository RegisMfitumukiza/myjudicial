export const ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/admin/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
    REFRESH: "/auth/refresh",
    MAGIC_LINK: "/auth/magic-link",
    OTP_SEND: "/auth/otp/send",
    OTP_VERIFY: "/auth/otp/verify",
    ADMIN_LOGIN: "/auth/admin/login",
    UPDATE_ME: "/auth/me",
  },
  EXPERTS: {
    PROFILE: "/experts/profile",
    PROFILE_ME: "/experts/profile/me",
    PROFILE_BY_ID: (id: string) => `/experts/${id}/profile`,
    SERVICES_BY_EXPERT: (expertId: string) => `/experts/${expertId}/services`,
    SERVICES: "/experts/services",
    SERVICE_BY_ID: (id: string) => `/experts/services/${id}`,
    AVAILABILITY: "/experts/availability",
    AVAILABILITY_PRESENCE: "/experts/availability",
    CERTIFICATIONS: "/experts/certifications",
    CERTIFICATION_BY_ID: (id: string) => `/experts/certifications/${id}`,
    EDUCATION: "/experts/education",
    EDUCATION_BY_ID: (id: string) => `/experts/education/${id}`,
    COMPLIANCE: "/experts/compliance",
    COMPLIANCE_EXPIRY: "/experts/compliance",
    EARNINGS: "/experts/earnings",
    STATISTICS: "/experts/statistics",
    VERIFICATION_SUBMIT: "/experts/verification/submit",
    // NOTE: Expert bookings are fetched from /bookings via the shared useGetBookings() hook.
    // There is no /experts/bookings route on the backend.
  },

  SEARCH: {
    EXPERTS: "/experts",
  },
  BOOKINGS: {
    BASE: "/bookings",
    BY_ID: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    CONFIRM: (id: string) => `/bookings/${id}/confirm`,
    JOIN: (id: string) => `/bookings/${id}/join`,
    EXPERT_SLOTS: (id: string) => `/bookings/expert/${id}/slots`,
  },
} as const
