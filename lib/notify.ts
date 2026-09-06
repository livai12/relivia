/**
 * Notification copy composer (PRD §21–§23).
 *
 * The notification is a TRIGGER only — it never contains the agent question
 * or clinical detail. Tapping it deep-links to /agent?session=<id> (PRD §25).
 */

export type NotificationType = "agent_question" | "insight_ready";

export function agentNotificationCopy(type: NotificationType): {
  title: string;
  body: string;
} {
  if (type === "agent_question") {
    return {
      title: "Relivia",
      body:
        "Perubahan pada pola pasien terdeteksi. " +
        "Relivia membutuhkan konteks tambahan untuk melanjutkan analisis. " +
        "Tap untuk melihat.",
    };
  }
  return {
    title: "Relivia",
    body:
      "Relivia menemukan insight baru tentang pola pasien. " +
      "Tap untuk melihat.",
  };
}

/** Deep-link target for a notification tap (PRD §25). */
export function agentDeepLink(sessionId: string): string {
  return `/agent?session=${sessionId}`;
}

/** Native deep-link URI handled by MainActivity → Capacitor App plugin. */
export function agentDeepLinkUri(sessionId: string): string {
  return `relivia://agent?session=${sessionId}`;
}
