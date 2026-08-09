# 📊 MyJudicial.com Platform Design System Mapping

This document defines the visual identity and UI component styling used across the MyJudicial platform. It establishes a consistent design language based on Tailwind CSS utility classes and brand color tokens to create an accessible, professional, and highly readable user experience.

---

# Global Style System

| Category         | Component         | Tailwind Token                | Design Rule                                                                   |
| ---------------- | ----------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| Typography       | Typography Suite  | `font-sans`                   | High-readability geometric font system designed to reduce cognitive overload. |
| Interface Canvas | Global Background | `bg-brand-canvas` (`#f8fafc`) | Provides a soft background that reduces glare and adds depth to dashboards.   |

---

# Navigation & Layout

| Component               | Tailwind Token                    | Design Rule                                                        |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------ |
| Sidebar & Header Frames | `bg-brand-dark` (`#0b2545`)       | Institutional dark tone used for strong structure and text weight. |
| Menu Dividers           | `border-brand-border` (`#e2e8f0`) | Thin separators for user records and database views.               |

---

# Interactive Map System

## Map Layer Controls

| Component         | Tailwind Token                | Design Rule                                                  |
| ----------------- | ----------------------------- | ------------------------------------------------------------ |
| Map Layer Toggle  | `text-brand-dark` (`#0b2545`) | Allows switching between 3D and satellite views in MapLibre. |
| Track My Location | `bg-white text-brand-blue`    | Floating location button enabling browser GPS tracking.      |
| Lawyer Pins       | `fill-brand-blue` (`#1d4ed8`) | High-visibility map markers with clean selection borders.    |

---

# AI Triage Components

## Support Chat Panel

| Component                  | Tailwind Token                 | Design Rule                                                             |
| -------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Chatbot Panel              | `border-l border-brand-border` | Anchored beside the primary workspace to provide contextual assistance. |
| Microphone Intake Button   | `bg-brand-blue` (`#1d4ed8`)    | Prominent voice-recording action for hands-free interaction.            |
| Audio Processing Indicator | `ring-brand-blue/30`           | Animated wave effect indicating active multilingual processing.         |

---

# Authentication & User Intake

## Branding Placement

| Component               | Token / Style                     | Design Rule                                                   |
| ----------------------- | --------------------------------- | ------------------------------------------------------------- |
| Logo Placement          | Center Top Alignment              | Displays the platform logo above the authentication area.     |
| OTP Inputs              | `focus:border-brand-blue`         | Input borders transition smoothly to the primary brand color. |
| Case Brief Upload Zone  | `border-brand-border` (`#e2e8f0`) | Dashed drag-and-drop area for secure file uploads.            |
| File Verification State | `text-brand-green`                | Indicates successful uploads with green checkmarks.           |

---

# Financial & Escrow Interface

## Status Indicators

| Component          | Tailwind Token                 | Design Rule                                                                    |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------ |
| Escrow Status      | `text-brand-green` (`#134021`) | Indicates successful payments held in escrow (`HELD_IN_ESCROW`).               |
| Alerts & Deadlines | `text-brand-alert` (`#d32f2f`) | Used for pending payments, expiring documents, and urgent legal notifications. |

---

# Brand Color Palette

| Token          | Color     | Usage                                      |
| -------------- | --------- | ------------------------------------------ |
| `brand-canvas` | `#f8fafc` | Global application background              |
| `brand-dark`   | `#0b2545` | Navigation, headers, and primary structure |
| `brand-blue`   | `#1d4ed8` | Interactive actions and map markers        |
| `brand-border` | `#e2e8f0` | Borders and separators                     |
| `brand-green`  | `#134021` | Success indicators and escrow states       |
| `brand-alert`  | `#d32f2f` | Warnings, deadlines, and urgent actions    |

---

# Design Principles

### Accessibility

* High-contrast interfaces.
* Readable typography.
* Reduced cognitive overload.

### Professional Identity

* Institutional dark blue foundations.
* Minimal visual noise.
* Structured dashboard layouts.

### Mobile-First Experience

* Responsive utility-driven components.
* Optimized for unstable network conditions.
* Fast rendering across devices.

### User Guidance

* Clear visual hierarchy.
* Color-coded states.
* Immediate feedback for important actions.

---

# Summary

The MyJudicial design system combines:

* **Tailwind CSS**
* **Custom brand tokens**
* **MapLibre interaction layers**
* **Accessible form components**
* **Escrow and legal workflow indicators**

to create a professional, consistent, and highly usable interface for citizens and legal professionals.
