export interface RememberedAccount {
  rememberToken: string;
  rememberProfile: {
    id: string;
    email: string;
    displayName: string;
    avatar?: string;
    deviceId: string;
    deviceName?: string;
    savedAt: number; // timestamp
  };
}

export interface RememberedLoginPayload {
  rememberToken: string;
  deviceId: string;
}

export interface RevokeRememberedAccountPayload {
  rememberToken: string;
  deviceId: string;
}
