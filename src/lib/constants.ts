// EasyInvest Platform Constants

export const UNIT_PRICE = 25000; // PKR per unit
export const CURRENCY = "PKR";
export const CURRENCY_SYMBOL = "₨";

export const APP_NAME = "EasyInvest";
export const APP_TAGLINE = "Shariah-Compliant Investment Platform";

export const KYC_STATUS = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const;

export const BUSINESS_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  FUNDED: "funded",
  CLOSED: "closed",
  REJECTED: "rejected",
} as const;

export const FUNDING_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
} as const;

export const INVESTMENT_STATUS = {
  ACTIVE: "active",
  REDEEMED: "redeemed",
  DEFAULTED: "defaulted",
} as const;

export const WITHDRAWAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  PROCESSED: "processed",
} as const;

export const LEDGER_ENTRY_TYPE = {
  INVESTMENT: "investment",
  PROFIT_DISTRIBUTION: "profit_distribution",
  WITHDRAWAL: "withdrawal",
  ADMIN_ADJUSTMENT: "admin_adjustment",
  DEPOSIT: "deposit",
} as const;

export const USER_ROLES = {
  INVESTOR: "investor",
  BUSINESS_OWNER: "business_owner",
  ADMIN: "admin",
} as const;

// Formatting helpers
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-PK").format(num);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};
