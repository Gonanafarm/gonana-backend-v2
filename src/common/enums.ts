export enum AccountStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
}

export enum TicketStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  CLOSED = "CLOSED",
}

export enum AccountType {
  ADMIN = "ADMIN",
  DRIVER = "DRIVER",
  INDIVIDUAL = "INDIVIDUAL",
}

export enum SignupAccountType {
  DRIVER = "DRIVER",
  INDIVIDUAL = "INDIVIDUAL",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  REQUESTED = "REQUESTED",
  APPROVED = "APPROVED",
  DISAPPROVED = "DISAPPROVED",
}

export enum TripInitiatedBy {
  DRIVER = "DRIVER",
  PASSENGER = "PASSENGER",
}

export enum TripStatus {
  PENDING = "PENDING",
  STARTED = "STARTED",
  CLOSED = "CLOSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum CancellationInitiatedBy {
  PASSENGER = " PASSENGER",
  DRIVER = "DRIVER",
}

export enum RefundType {
  FULL = "FULL",
  PARTIAL = "PARTIAL",
}
export enum ReservationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

export enum PayoutStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  DECLINED = "DECLINED",
}

export enum PayoutPaymentStatus {
  INITIATED = "INITIATED",
  COMPLETED = "COMPLETED",
  DECLINED = "DECLINED",
}

export enum PayoutType {
  SETTLEMENT = "SETTLEMENT",
  REFUND = "REFUND",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}

export enum BookingSettlementStatus {
  COMPLETED = "COMPLETED",
  PENDING = "PENDING",
}

export enum BookingStatus {
  COMPLETED = "COMPLETED",
  ONBOARDED = "ONBOARDED",
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
}
