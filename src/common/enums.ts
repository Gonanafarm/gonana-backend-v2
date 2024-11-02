export enum AccountStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
}

export enum AccountType {
  ADMIN = "ADMIN",
  DRIVER = "FARMER",
  INDIVIDUAL = "INDIVIDUAL",
}

export enum SignupAccountType {
  DRIVER = "FARMER",
  INDIVIDUAL = "INDIVIDUAL",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  DISAPPROVED = "DISAPPROVED",
}

export const gonanaAccountName = process.env.GONANA_ACCOUNT_NAME as string;
export const gonanaAccountBankName = process.env
  .GONANA_ACCOUNT_BANK_NAME as string;
export const gonanaAccountNumber = process.env
  .GONANA_VIRTUAL_ACCOUNT_NUMBER as string;
export const gonanaAdminAddress = process.env.GONANA_ADMIN_ADDRESS;
export const gonanaAdminPassword = process.env.GONANA_ADMIN_ADDRESS_PASSWORD;
export const gonanaAdminPhoneNumber = process.env.GONANA_ADMIN_PHONE_NUMBER;
export const gonaAdminToken = {
  index: 9774,
  subindex: 0,
};

export const toronetHeaders = {
  admin: process.env.TORONET_ADMIN_ADDRESS,
  adminpwd: process.env.TORONET_ADMIN_PASSWORD,
};
export const toronetBaseUrl = process.env.TORONET_BASE_URL;
export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}
