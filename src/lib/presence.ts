export const APP_PRESENCE_CHANNEL = "presence-app";

export type PresenceMember = {
  id: string;
  name?: string | null;
  image?: string | null;
  role?: string | null;
};

export type PresenceSnapshot = {
  count: number;
  members: PresenceMember[];
  updatedAt: number;
};

export const EMPTY_PRESENCE: PresenceSnapshot = {
  count: 0,
  members: [],
  updatedAt: 0,
};

declare global {
  interface Window {
    __mafiaPresence?: PresenceSnapshot;
  }
}
