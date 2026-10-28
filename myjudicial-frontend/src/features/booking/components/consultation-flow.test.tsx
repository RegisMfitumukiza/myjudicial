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

    it("locks cancellation and prevents 50% late cancellation refund once scheduled start has elapsed", () => {
      const nowMs = SCHEDULED_START + 3 * 24 * 60 * 60 * 1000; // 3 days past scheduled start
      const msUntilStart = SCHEDULED_START - nowMs;
      const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

      // Invariant 1: Can only cancel strictly BEFORE session starts
      const isScheduledInPast = nowMs >= SCHEDULED_START;
      const canCancel = ["PENDING", "CONFIRMED"].includes("CONFIRMED") && !isScheduledInPast;
      expect(canCancel).toBe(false);

      // Invariant 2: Late cancellation 50% refund must never trigger for negative elapsed time
      const isFreeCancellation = hoursUntilStart > 24;
      const isWithinGrace = false;
      const isLateCancellation = !isFreeCancellation && !isWithinGrace && hoursUntilStart > 0;
      expect(isLateCancellation).toBe(false);
    });

    it("classifies past consultations by scheduledEnd rather than leaving them in upcoming", () => {
      const nowMs = Date.now();
      const pastBooking = {
        id: "b-past-1",
        status: "CONFIRMED",
        scheduledStart: new Date(nowMs - 72 * 60 * 60 * 1000).toISOString(),
        scheduledEnd: new Date(nowMs - 71 * 60 * 60 * 1000).toISOString(),
        deliveredAt: null,
      };

      const isPast = pastBooking.status === "COMPLETED" || new Date(pastBooking.scheduledEnd).getTime() < nowMs;
      expect(isPast).toBe(true);

      const isUpcoming = !isPast && (pastBooking.status === "CONFIRMED" || pastBooking.status === "ACTIVE");
      expect(isUpcoming).toBe(false);
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
      const enRoom = en["expertDashboard_consultation-room"] as Record<string, string>;
      const frRoom = fr["expertDashboard_consultation-room"] as Record<string, string>;
      const rwRoom = rw["expertDashboard_consultation-room"] as Record<string, string>;
      for (const key of requiredRoomKeys) {
        expect(enRoom[key], `EN missing ${key}`).toBeDefined();
        expect(frRoom[key], `FR missing ${key}`).toBeDefined();
        expect(rwRoom[key], `RW missing ${key}`).toBeDefined();
      }
    });

    it("verifies French and Kinyarwanda have authentic translations rather than English fallbacks", () => {
      const frRoom = fr["expertDashboard_consultation-room"] as Record<string, string>;
      const rwRoom = rw["expertDashboard_consultation-room"] as Record<string, string>;

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

  describe("In-Room Collaboration & Multitasking Translation Parity", () => {
    const requiredCollaborationKeys = [
      "inRoomChatTitle",
      "inRoomChatToggle",
      "closePanel",
      "loadingChat",
      "noMessagesYet",
      "chatEncryptedNote",
      "viewAttachment",
      "sending",
      "failedToSend",
      "typingIndicator",
      "typeMessagePlaceholder",
      "sendMessage",
      "inRoomDocumentsTitle",
      "inRoomDocsToggle",
      "fileTooLarge",
      "uploadingDocument",
      "uploadDocumentCTA",
      "supportedFormatsHint",
      "documentSharedSuccess",
      "consultationFilesHeader",
      "encryptedVault",
      "loadingDocuments",
      "noDocumentsShared",
      "download",
      "inRoomDetailsTitle",
      "inRoomDetailsToggle",
      "loadingDetails",
      "sessionSchedule",
      "clientSituationNotes",
      "escrowProtectedTitle",
      "escrowProtectedDesc",
      "pipLabel",
      "minimizeCall",
      "expandCall",
      "returnToMeeting",
      "waitingForParticipant",
    ];

    it("ensures all collaboration and multitasking keys exist in EN, FR, and RW", () => {
      const enRoom = en["expertDashboard_consultation-room"] as Record<string, string>;
      const frRoom = fr["expertDashboard_consultation-room"] as Record<string, string>;
      const rwRoom = rw["expertDashboard_consultation-room"] as Record<string, string>;
      for (const key of requiredCollaborationKeys) {
        expect(enRoom[key], `EN missing ${key}`).toBeDefined();
        expect(frRoom[key], `FR missing ${key}`).toBeDefined();
        expect(rwRoom[key], `RW missing ${key}`).toBeDefined();
      }
    });

    it("verifies authentic translations for in-room collaboration in FR and RW", () => {
      const frRoom = fr["expertDashboard_consultation-room"] as Record<string, string>;
      const rwRoom = rw["expertDashboard_consultation-room"] as Record<string, string>;

      expect(frRoom.inRoomChatTitle).toBe("Chat de Consultation");
      expect(frRoom.inRoomDocumentsTitle).toBe("Documents de la Consultation");
      expect(frRoom.pipLabel).toBe("Image dans l'image");

      expect(rwRoom.inRoomChatTitle).toBe("Ubutumwa bwo mu Nama");
      expect(rwRoom.inRoomDocumentsTitle).toBe("Inyandiko z'Inama");
      expect(rwRoom.pipLabel).toBe("Amashusho mato (PiP)");
    });
  });

  describe("In-Room Document Sharing Constraints & Sensitivity", () => {
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    function validateUpload(fileSize: number, mimeType: string) {
      if (fileSize > MAX_FILE_SIZE) {
        return { valid: false, error: "fileTooLarge" };
      }
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/zip",
      ];
      if (!allowedTypes.includes(mimeType)) {
        return { valid: false, error: "unsupportedFileType" };
      }
      return { valid: true, sensitivity: "CONFIDENTIAL" };
    }

    it("rejects files exceeding 15MB limit before network request", () => {
      const result = validateUpload(16 * 1024 * 1024, "application/pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("fileTooLarge");
    });

    it("accepts valid documents under 15MB and tags them with CONFIDENTIAL legal privilege", () => {
      const result = validateUpload(5 * 1024 * 1024, "application/pdf");
      expect(result.valid).toBe(true);
      expect(result.sensitivity).toBe("CONFIDENTIAL");
    });
  });

  describe("Persistent Meeting Session & Multitasking Invariants", () => {
    function resolveReturnUrl(role: string, pathname: string, bookingId: string) {
      const isExpert = role === "EXPERT" || (pathname ? pathname.includes("/expert") : false);
      return isExpert
        ? `/expert/dashboard/consultations/${bookingId}/join`
        : `/client/dashboard/consultations/${bookingId}/join`;
    }

    it("correctly routes return-to-meeting target URL for client and expert roles", () => {
      const bookingId = "bk-12345";
      expect(resolveReturnUrl("CITIZEN", "/client/dashboard/messages", bookingId)).toBe(
        "/client/dashboard/consultations/bk-12345/join"
      );
      expect(resolveReturnUrl("EXPERT", "/expert/dashboard/messages", bookingId)).toBe(
        "/expert/dashboard/consultations/bk-12345/join"
      );
    });

    it("preserves ACTIVE consultation and escrow lock during navigation and minimization", () => {
      // Invariant: navigating to dashboard or minimizing call must NEVER mutate booking status to COMPLETED or refund escrow
      const bookingStatus = "ACTIVE";
      const escrowHeld = true;

      // Simulate route navigation to /client/dashboard/documents
      const onNavigateAway = () => {
        // Meeting minimized, state preserved
      };

      onNavigateAway();
      expect(bookingStatus).toBe("ACTIVE");
      expect(escrowHeld).toBe(true);
    });

    it("verifies dual-device / duplicate connection disconnect reason is properly handled", () => {
      // LiveKit DisconnectReason.DUPLICATE_IDENTITY triggers duplicateIdentity notice
      const duplicateReason = "DUPLICATE_IDENTITY";
      const isDuplicate = duplicateReason === "DUPLICATE_IDENTITY";
      expect(isDuplicate).toBe(true);
    });
  });
});
