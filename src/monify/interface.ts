export interface ReserveAccountPayload {
  accountName: string;
  accountReference: string;
  currencyCode: string;
  contractCode: string;
  customerName: string;
  customerEmail: string;
  incomeSplitConfig: {
    subAccountCode: string;
    splitPercentage: number;
    feePercentage: number;
    feeBearer: boolean;
  }[];
}

export class MFPaymentSource {
  bankCode: string;
  amountPaid: number;
  accountName: string;
  sessionId: string;
  accountNumber: string;
}

export class MFDestinationAccount {
  bankCode: string;
  bankName: string;
  accountNumber:string;
}
