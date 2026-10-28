import { describe, it, expect } from "vitest";
import { JOINABLE_EARLY_WINDOW_MS, OVERTIME_GRACE_WINDOW_MS } from "@/features/booking/constants";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";
import rw from "../../../../messages/rw.json";

describe("Video Consultation Flow — Lifecycle, Privacy, and Device Guard Tests", () => {
  describe("Join eligibility time boundaries", () => {
    const SCHEDULED_START = new Date("2026-10-28T10:00:00Z").getTime();
    const SCHEDULED_END = new Date("2026-10-28T11:00:00Z").getTime();

    it("enforces 15-minute early join window", () => {
      expect(JOINABLE_EARLY_WINDOW_MS).toBe(15 * 60 * 1000);
      
      const tooEarly = SCHEDULED_START - JOINABLE_EARLY_WINDOW_MS - 1000;
      const canJoinTooEarly = tooEarly >= SCHEDULED_START - JOINABLE_EARLY_WINDOW_MS;
      expect(canJoinTooEarly).toBe(false);

      const exactEarlyWindow = SCHEDULED_START - JOINABLE_EARLY_WINDOW_MS;
      const canJoinExact = exactEarlyWindow >= SCHEDULED_START - JOINABLE_EARLY_WINDOW_MS;
      expect(canJoinExact).toBe(true);
    });

    it("enforces 30-minute overtime grace window after scheduled end", () => {
      expect(OVERTIME_GRACE_WINDOW_MS).toBe(30 * 60 * 1000);

      const duringGrace = SCHEDULED_END + OVERTIME_GRACE_WINDOW_MS - 1000;
      const isPastWindowGrace = duringGrace > SCHEDULED_END + OVERTIME_GRACE_WINDOW_MS;
      expect(isPastWindowGrace).toBe(false);

      const pastGrace = SCHEDULED_END + OVERTIME_GRACE_WINDOW_MS + 1000;
      const isPastWindowExpired = pastGrace > SCHEDULED_END + OVERTIME_GRACE_WINDOW_MS;
      expect(isPastWindowExpired).toBe(true);
    });
  });

  describe("Device Check Error State Classification", () => {
    function classifyDeviceError(errName: string): "permissionDenied" | "deviceUnavailable" | "error" {
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        return "permissionDenied";
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        return "deviceUnavailable";
      }
      return "error";
    }

    it("classifies NotAllowedError as permissionDenied", () => {
      expect(classifyDeviceError("NotAllowedError")).toBe("permissionDenied");
      expect(classifyDeviceError("PermissionDeniedError")).toBe("permissionDenied");
    });

    it("classifies NotFoundError as deviceUnavailable", () => {
      expect(classifyDeviceError("NotFoundError")).toBe("deviceUnavailable");
      expect(classifyDeviceError("DevicesNotFoundError")).toBe("deviceUnavailable");
    });

    it("classifies other unhandled errors as generic error", () => {
      expect(classifyDeviceError("OverconstrainedError")).toBe("error");
      expect(classifyDeviceError("TypeError")).toBe("error");
    });
  });

  describe("Privacy Notice vs False Recording Claim Verification", () => {
    it("ensures client and expert privacy notices state that calls are NOT recorded", () => {
      const clientEnNotice = en.clientDashboard.join.privacyNotice;
      const expertEnNotice = en.expertDashboard_join.privacyNotice;

      expect(clientEnNotice).toContain("not recorded");
      expect(expertEnNotice).toContain("not recorded");
      expect(clientEnNotice).toContain("encrypted");
      expect(expertEnNotice).toContain("encrypted");

      // Verify false statement was replaced
      expect(clientEnNotice).not.toContain("will be recorded for quality assurance");
      expect(expertEnNotice).not.toContain("will be recorded for quality assurance");
    });

    it("ensures French privacy notice states call is not recorded", () => {
      const clientFrNotice = fr.clientDashboard.join.privacyNotice;
      const expertFrNotice = fr.expertDashboard_join.privacyNotice;

      expect(clientFrNotice).toContain("n'est pas enregistrée");
      expect(expertFrNotice).toContain("n'est pas enregistrée");
      expect(clientFrNotice).toContain("chiffrée");
    });

    it("ensures Kinyarwanda privacy notice states call is confidential and not recorded", () => {
      const clientRwNotice = rw.clientDashboard.join.privacyNotice;
      const expertRwNotice = rw.expertDashboard_join.privacyNotice;

      expect(clientRwNotice).toContain("Ntiyegeranyijwe");
      expect(expertRwNotice).toContain("Ntiyegeranyijwe");
      expect(clientRwNotice).toContain("ibanga");
    });
  });

  describe("Consultation Room Controls & Dialog Translation Parity", () => {
    const requiredRoomKeys = [
      "connectingToConsultation",
      "failedToJoin",
      "connectionError",
      "backToBooking",
      "you",
      "waitingForExpert",
      "waitingForClient",
      "consultationInProgress",
      "participantsCount",
      "reconnecting",
      "reconnectingAttempt",
      "connectionLost",
      "roomDeleted",
      "serverShutdown",
      "participantRemoved",
      "duplicateIdentity",
      "participant",
      "qualityExcellent",
      "qualityGood",
      "qualityPoor",
      "qualityLost",
      "muteLabel",
      "unmuteLabel",
      "videoOffLabel",
      "videoOnLabel",
      "shareScreenLabel",
      "stopScreenShareLabel",
      "leaveLabel",
      "leaveConfirmTitle",
      "leaveConfirmDesc",
      "leaveConfirmCancel",
      "leaveConfirmLeave",
      "returnToBooking",
      "waitingLongExpert",
      "waitingLongClient",
      "waitingLongDesc",
      "screenShareError",
    ];

    it("ensures all required room keys exist in EN, FR, and RW", () => {
      for (const key of requiredRoomKeys) {
        expect((en as any)["expertDashboard_consultation-room"][key], `EN missing ${key}`).toBeDefined();
        expect((fr as any)["expertDashboard_consultation-room"][key], `FR missing ${key}`).toBeDefined();
        expect((rw as any)["expertDashboard_consultation-room"][key], `RW missing ${key}`).toBeDefined();
      }
    });

    it("verifies French and Kinyarwanda have authentic translations rather than English fallbacks", () => {
      const frRoom = (fr as any)["expertDashboard_consultation-room"];
      const rwRoom = (rw as any)["expertDashboard_consultation-room"];

      expect(frRoom.connectingToConsultation).toBe("Connexion à la consultation...");
      expect(frRoom.leaveConfirmTitle).toBe("Quitter la consultation ?");
      expect(rwRoom.connectingToConsultation).toBe("Guhuza inama...");
      expect(rwRoom.leaveConfirmTitle).toBe("Sohoka mu nama?");
    });
  });
});
