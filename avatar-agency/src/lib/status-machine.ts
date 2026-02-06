/**
 * Status Machine for Project Workflow
 *
 * This module enforces valid status transitions for the project pipeline.
 * It ensures projects cannot skip steps or enter invalid states.
 *
 * Workflow Overview:
 * ┌─────────┐   ┌─────────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
 * │ CREATED │ → │ RESEARCH_IN_PROGRESS│ → │ RESEARCH_COMPLETE│ → │ SCRIPT_IN_PROGRESS   │
 * └─────────┘   └─────────────────────┘   └──────────────────┘   └──────────────────────┘
 *                                                                          ↓
 *                                                              ┌──────────────────────────┐
 *                                                              │ SCRIPT_PENDING_APPROVAL  │
 *                                                              └──────────────────────────┘
 *                                                                ↓ approve      ↓ reject
 *                                                        ┌───────────────┐      │
 *                                                        │SCRIPT_APPROVED│      │ (back to SCRIPT_IN_PROGRESS
 *                                                        └───────────────┘      │  + optimizer webhook)
 *                                                                ↓
 *                                                        ┌────────────────────────┐
 *                                                        │ PRODUCTION_IN_PROGRESS │
 *                                                        └────────────────────────┘
 *                                                                ↓
 *                                                        ┌────────────────────────────┐
 *                                                        │PRODUCTION_PENDING_APPROVAL │
 *                                                        └────────────────────────────┘
 *                                                          ↓ approve         ↓ reject
 *                                                   ┌─────────────────┐      │
 *                                                   │ EDITING_ASSIGNED│      │ (back to PRODUCTION_IN_PROGRESS)
 *                                                   └─────────────────┘
 *                                                          ↓
 *                                                   ┌─────────────────────┐
 *                                                   │ EDITING_IN_PROGRESS │
 *                                                   └─────────────────────┘
 *                                                          ↓
 *                                                   ┌──────────────┐
 *                                                   │ FINAL_REVIEW │
 *                                                   └──────────────┘
 *                                                          ↓
 *                                                   ┌───────────┐
 *                                                   │ COMPLETED │
 *                                                   └───────────┘
 *
 * CANCELLED can be reached from any non-terminal state.
 */

import { ProjectStatus } from "@prisma/client";

/**
 * Defines all valid status transitions.
 * Key: current status
 * Value: array of statuses that can be transitioned TO from the current status
 */
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  // Initial state - project just created, waiting for research webhook to fire
  CREATED: [
    "RESEARCH_IN_PROGRESS", // Research webhook triggered
    "CANCELLED",
  ],

  // Research webhook is running (N8N processing)
  RESEARCH_IN_PROGRESS: [
    "RESEARCH_COMPLETE", // Research callback received
    "CANCELLED",
  ],

  // Research done - scripting webhook fires automatically
  RESEARCH_COMPLETE: [
    "SCRIPT_IN_PROGRESS", // Scripting webhook triggered
    "CANCELLED",
  ],

  // Scripting webhook (or optimizer) is running
  SCRIPT_IN_PROGRESS: [
    "SCRIPT_PENDING_APPROVAL", // Script callback received
    "CANCELLED",
  ],

  // Script ready for admin review
  SCRIPT_PENDING_APPROVAL: [
    "SCRIPT_APPROVED", // Admin approves
    "SCRIPT_IN_PROGRESS", // Admin rejects → optimizer runs
    "CANCELLED",
  ],

  // Script approved - production webhook fires automatically
  SCRIPT_APPROVED: [
    "PRODUCTION_IN_PROGRESS", // Production webhook triggered
    "CANCELLED",
  ],

  // Production webhook is running (video generation)
  PRODUCTION_IN_PROGRESS: [
    "PRODUCTION_PENDING_APPROVAL", // Production callback received
    "CANCELLED",
  ],

  // Raw video ready for admin review
  PRODUCTION_PENDING_APPROVAL: [
    "PRODUCTION_APPROVED", // Admin approves (legacy - kept for data compatibility)
    "EDITING_ASSIGNED", // Admin approves + assigns editor (recommended flow)
    "PRODUCTION_IN_PROGRESS", // Admin rejects → regenerate
    "CANCELLED",
  ],

  // Video approved (legacy intermediate state)
  // In practice, we skip this and go directly to EDITING_ASSIGNED
  PRODUCTION_APPROVED: [
    "EDITING_ASSIGNED", // Editor assigned
    "CANCELLED",
  ],

  // Editor has been assigned the project
  EDITING_ASSIGNED: [
    "EDITING_IN_PROGRESS", // Editor starts work
    "CANCELLED",
  ],

  // Editor is working on the video
  EDITING_IN_PROGRESS: [
    "FINAL_REVIEW", // Editor submits final video
    "CANCELLED",
  ],

  // Final video submitted, waiting for admin approval
  FINAL_REVIEW: [
    "COMPLETED", // Admin approves final
    "EDITING_IN_PROGRESS", // Admin requests changes
    "CANCELLED",
  ],

  // Terminal states - no further transitions allowed
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Human-readable labels for each status
 */
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  CREATED: "Created",
  RESEARCH_IN_PROGRESS: "Researching",
  RESEARCH_COMPLETE: "Research Complete",
  SCRIPT_IN_PROGRESS: "Writing Script",
  SCRIPT_PENDING_APPROVAL: "Script Pending Approval",
  SCRIPT_APPROVED: "Script Approved",
  PRODUCTION_IN_PROGRESS: "Generating Video",
  PRODUCTION_PENDING_APPROVAL: "Video Pending Approval",
  PRODUCTION_APPROVED: "Video Approved",
  EDITING_ASSIGNED: "Assigned to Editor",
  EDITING_IN_PROGRESS: "Editing",
  FINAL_REVIEW: "Final Review",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/**
 * Status categories for grouping and filtering
 */
export const STATUS_CATEGORIES = {
  /** Statuses where admin action is required */
  PENDING_ADMIN_ACTION: [
    "SCRIPT_PENDING_APPROVAL",
    "PRODUCTION_PENDING_APPROVAL",
    "FINAL_REVIEW",
  ] as ProjectStatus[],

  /** Statuses where the system/webhook is processing */
  IN_PROGRESS: [
    "RESEARCH_IN_PROGRESS",
    "SCRIPT_IN_PROGRESS",
    "PRODUCTION_IN_PROGRESS",
  ] as ProjectStatus[],

  /** Statuses where editor has work to do */
  EDITOR_ACTIVE: [
    "EDITING_ASSIGNED",
    "EDITING_IN_PROGRESS",
  ] as ProjectStatus[],

  /** Terminal states */
  TERMINAL: ["COMPLETED", "CANCELLED"] as ProjectStatus[],

  /** All active (non-terminal) statuses */
  ACTIVE: [
    "CREATED",
    "RESEARCH_IN_PROGRESS",
    "RESEARCH_COMPLETE",
    "SCRIPT_IN_PROGRESS",
    "SCRIPT_PENDING_APPROVAL",
    "SCRIPT_APPROVED",
    "PRODUCTION_IN_PROGRESS",
    "PRODUCTION_PENDING_APPROVAL",
    "PRODUCTION_APPROVED",
    "EDITING_ASSIGNED",
    "EDITING_IN_PROGRESS",
    "FINAL_REVIEW",
  ] as ProjectStatus[],
};

/**
 * Check if a transition from one status to another is valid.
 *
 * @param from - The current project status
 * @param to - The target status to transition to
 * @returns true if the transition is valid, false otherwise
 *
 * @example
 * isValidTransition("SCRIPT_PENDING_APPROVAL", "SCRIPT_APPROVED") // true
 * isValidTransition("CREATED", "COMPLETED") // false - can't skip steps
 */
export function isValidTransition(
  from: ProjectStatus,
  to: ProjectStatus
): boolean {
  const validTargets = VALID_TRANSITIONS[from];
  return validTargets.includes(to);
}

/**
 * Get all valid statuses that can be transitioned to from the current status.
 *
 * @param current - The current project status
 * @returns Array of valid target statuses
 *
 * @example
 * getNextValidStatuses("SCRIPT_PENDING_APPROVAL")
 * // Returns: ["SCRIPT_APPROVED", "SCRIPT_IN_PROGRESS", "CANCELLED"]
 */
export function getNextValidStatuses(current: ProjectStatus): ProjectStatus[] {
  return [...VALID_TRANSITIONS[current]];
}

/**
 * Check if a project in the given status can be cancelled.
 * Projects can be cancelled from any non-terminal state.
 *
 * @param current - The current project status
 * @returns true if the project can be cancelled
 */
export function canCancel(current: ProjectStatus): boolean {
  return isValidTransition(current, "CANCELLED");
}

/**
 * Check if a status is a terminal state (no further transitions possible).
 *
 * @param status - The status to check
 * @returns true if the status is terminal
 */
export function isTerminalStatus(status: ProjectStatus): boolean {
  return STATUS_CATEGORIES.TERMINAL.includes(status);
}

/**
 * Check if a status requires admin action.
 *
 * @param status - The status to check
 * @returns true if admin action is needed
 */
export function requiresAdminAction(status: ProjectStatus): boolean {
  return STATUS_CATEGORIES.PENDING_ADMIN_ACTION.includes(status);
}

/**
 * Check if a status means the project is actively being processed.
 *
 * @param status - The status to check
 * @returns true if webhooks/system is processing
 */
export function isProcessing(status: ProjectStatus): boolean {
  return STATUS_CATEGORIES.IN_PROGRESS.includes(status);
}

/**
 * Check if a status means the editor has active work.
 *
 * @param status - The status to check
 * @returns true if editor has work to do
 */
export function isEditorActive(status: ProjectStatus): boolean {
  return STATUS_CATEGORIES.EDITOR_ACTIVE.includes(status);
}

/**
 * Validate a status transition and return a descriptive error if invalid.
 *
 * @param from - The current project status
 * @param to - The target status to transition to
 * @returns null if valid, error message string if invalid
 *
 * @example
 * validateTransition("CREATED", "COMPLETED")
 * // Returns: "Cannot transition from 'Created' to 'Completed'. Valid next statuses: Researching, Cancelled"
 */
export function validateTransition(
  from: ProjectStatus,
  to: ProjectStatus
): string | null {
  if (isValidTransition(from, to)) {
    return null;
  }

  const validTargets = getNextValidStatuses(from);

  if (validTargets.length === 0) {
    return `Project is in terminal state '${STATUS_LABELS[from]}' and cannot be changed.`;
  }

  const validLabels = validTargets.map((s) => STATUS_LABELS[s]).join(", ");
  return `Cannot transition from '${STATUS_LABELS[from]}' to '${STATUS_LABELS[to]}'. Valid next statuses: ${validLabels}`;
}

/**
 * Get the status color for UI display.
 * Follows the existing color scheme from the codebase.
 *
 * @param status - The status to get color for
 * @returns Tailwind color class suffix (e.g., "yellow", "green", "red")
 */
export function getStatusColor(
  status: ProjectStatus
): "yellow" | "green" | "blue" | "red" | "gray" | "purple" | "orange" {
  switch (status) {
    case "CREATED":
      return "gray";
    case "RESEARCH_IN_PROGRESS":
    case "SCRIPT_IN_PROGRESS":
    case "PRODUCTION_IN_PROGRESS":
      return "blue";
    case "RESEARCH_COMPLETE":
    case "SCRIPT_APPROVED":
    case "PRODUCTION_APPROVED":
      return "purple";
    case "SCRIPT_PENDING_APPROVAL":
    case "PRODUCTION_PENDING_APPROVAL":
    case "FINAL_REVIEW":
      return "yellow";
    case "EDITING_ASSIGNED":
    case "EDITING_IN_PROGRESS":
      return "orange";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Get the progress percentage for a given status.
 * Useful for progress bars in the UI.
 *
 * @param status - The status to get progress for
 * @returns Progress percentage (0-100)
 */
export function getStatusProgress(status: ProjectStatus): number {
  const progressMap: Record<ProjectStatus, number> = {
    CREATED: 0,
    RESEARCH_IN_PROGRESS: 10,
    RESEARCH_COMPLETE: 20,
    SCRIPT_IN_PROGRESS: 30,
    SCRIPT_PENDING_APPROVAL: 40,
    SCRIPT_APPROVED: 50,
    PRODUCTION_IN_PROGRESS: 60,
    PRODUCTION_PENDING_APPROVAL: 70,
    PRODUCTION_APPROVED: 75,
    EDITING_ASSIGNED: 80,
    EDITING_IN_PROGRESS: 85,
    FINAL_REVIEW: 95,
    COMPLETED: 100,
    CANCELLED: 0,
  };

  return progressMap[status];
}
