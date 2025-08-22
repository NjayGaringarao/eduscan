//#region API

export type AdminStatus = {
  isInitialized: boolean;
  isVerified: boolean;
};

export type UserApplicationStatus = {
  isOn: boolean;
  count: number;
};

export type KioskStatus = {
  isInitialized: boolean;
  isEnabled: boolean;
};

//#region Dialog

type AlertMode = "INFO" | "SUCCESS" | "ERROR";
type ConfirmMode = "DEFAULT" | "CRITICAL";

type AlertOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  mode?: AlertMode;
  backdropOnClose?: boolean;
  displayTime?: number;
};

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  mode?: ConfirmMode;
};

type DialogContextType = {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};
