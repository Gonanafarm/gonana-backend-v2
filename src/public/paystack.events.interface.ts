type TAuthorization = {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  account_name: string;
};

type TPlan = {
  name: string;
  plan_code: string;
  description: string;
  amount: string;
  interval: string;
  send_invoices: boolean;
  send_sms: boolean;
  currency: string;
};
type TCustomer = {
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone: string;
};
export type TSubscriptionCreatetd = {
  event: "subscription.create";
  data: {
    domain: string;
    status: string;
    subscription_code: string;
    amount: number;
    cron_expression: string;
    next_payment_date: string;
    open_invoice: string;
    createdAt: string;
    plan: TPlan;
    authorization: TAuthorization;
    customer: TCustomer;
    created_at: string;
  };
};

export type TSubscriptionDisabled = {
  event: "subscription.disable";
  data: {
    domain:  string;
    status: string;
    subscription_code: string;
    email_token: string;
    amount:number;
    cron_expression: string
    next_payment_date: string;
    open_invoice: null;
    plan: TPlan;
    authorization: TAuthorization | any;
    customer: TCustomer;
    created_at: string;
  };
};

export type TSubscriptionNotRenewing = {
  event: "subscription.not_renew";
  data: {
    id: 317617;
    domain: "test";
    status: "non-renewing";
    subscription_code: "SUB_d638sdiWAio7jnl";
    email_token: "086x99rmqc4qhcw";
    amount: 120000;
    cron_expression: "0 0 8 10 *";
    next_payment_date: null;
    open_invoice: null;
    integration: 116430;
    plan: TPlan;
    authorization: TAuthorization|any;
    customer: TCustomer;
    invoices: [];
    invoices_history: [];
    invoice_limit: 0;
    split_code: null;
    most_recent_invoice: null;
    created_at: "2021-10-08T14:50:39.000Z";
  };
};

export type TSubscriptionWithExpiringCards = {
  event: "subscription.expiring_cards";
  data: [
    {
      expiry_date: string;
      description: string;
      brand: string;
      subscription: {
        id: string;
        subscription_code: string;
        amount: number;
        next_payment_date: string;
        plan: TPlan;
      };
      customer: TCustomer;
    }
  ];
};

export type TTransactionCharge = {
  event: "charge.success";
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: number;
    fees: null;
    customer: TCustomer;
    authorization?: TAuthorization | any;
    plan: TPlan;
  };
};