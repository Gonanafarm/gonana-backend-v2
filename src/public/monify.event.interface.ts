import {MFDestinationAccount, MFPaymentSource} from "../monify/interface";

export interface MonifyTransactionEventPayload {
  eventData: {
    product: {reference: "joshuanwafor"; type: "RESERVED_ACCOUNT"};
    transactionReference: string;
    paymentReference: string;
    paidOn: string;
    paymentDescription: string;
    metaData: {};
    paymentSourceInformation: MFPaymentSource[];
    destinationAccountInformation: MFDestinationAccount;
    amountPaid: string;
    totalPayable: string;
    cardDetails: {};
    paymentMethod: string;
    currency: string;
    settlementAmount: string;
    paymentStatus: string;
    customer: {name: string; email: string};
  };
  eventType: "SUCCESSFUL_TRANSACTION";
}
