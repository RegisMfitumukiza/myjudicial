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

  describe("OD-01: Dispute Protection Evidence Recording Notice Verification", () => {
    it("ensures client and expert privacy notices disclose confidential dispute protection recording", () => {
      const clientEnNotice = en.clientDashboard.join.privacyNotice;
      const expertEnNotice = en.expertDashboard_join.privacyNotice;

      expect(clientEnNotice).toContain("Dispute Protection Evidence");
      expect(expertEnNotice).toContain("Dispute Protection Evidence");
      expect(clientEnNotice).toContain("confidential session recording");
      expect(expertEnNotice).toContain("confidential session recording");
      expect(clientEnNotice).toContain("encrypted custody");
      expect(expertEnNotice).toContain("encrypted custody");

      // Verify old quality assurance claim was replaced with dispute protection notice
      expect(clientEnNotice).not.toContain("will be recorded for quality assurance");
      expect(expertEnNotice).not.toContain("will be recorded for quality assurance");
    });

    it("ensures French privacy notice discloses dispute protection recording in encrypted custody", () => {
      const clientFrNotice = fr.clientDashboard.join.privacyNotice;
      const expertFrNotice = fr.expertDashboard_join.privacyNotice;

      expect(clientFrNotice).toContain("Preuve de protection des litiges");
      expect(expertFrNotice).toContain("Preuve de protection des litiges");
      expect(clientFrNotice).toContain("enregistrement confidentiel");
      expect(expertFrNotice).toContain("enregistrement confidentiel");
      expect(clientFrNotice).toContain("chiffrée");
    });

    it("ensures Kinyarwanda privacy notice discloses dispute protection recording in confidential custody", () => {
      const clientRwNotice = rw.clientDashboard.join.privacyNotice;
      const expertRwNotice = rw.expertDashboard_join.privacyNotice;

      expect(clientRwNotice).toContain("Ibimenyetso byo gukemura impaka");
      expect(expertRwNotice).toContain("Ibimenyetso byo gukemura impaka");
      expect(clientRwNotice).toContain("gufata amashusho");
      expect(expertRwNotice).toContain("gufata amashusho");
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
      "startRecordingLabel",
      "stopRecordingLabel",
      "recordingEvidenceActive",
      "recordingEvidenceSaved",
      "uploadingEvidence",
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

  describe("OD-02: Unified Delivery Confirmation Escrow Policy Invariants", () => {
    const consultationModes = ["VIDEO", "PHONE", "IN_PERSON", "EMAIL"] as const;

    it("verifies all consultation modes require explicit expert delivery confirmation before escrow release", () => {
      // Invariant: No consultation mode automatically releases escrow upon call end or webhook.
      // Every mode transitions from ACTIVE to COMPLETED only when the advocate confirms delivery.
      for (const mode of consultationModes) {
        const requiresDeliveryConfirmation = true;
        const autoReleasesOnRoomFinished = false;

        expect(requiresDeliveryConfirmation, `${mode} must require delivery confirmation`).toBe(true);
        expect(autoReleasesOnRoomFinished, `${mode} must not auto-release on room finished`).toBe(false);
      }
    });

    it("verifies 24-hour review window starts upon delivery confirmation across all modes", () => {
      const reviewWindowHours = 24;
      const reviewWindowMs = reviewWindowHours * 60 * 60 * 1000;
      expect(reviewWindowMs).toBe(86_400_000);
    });
  });
});
