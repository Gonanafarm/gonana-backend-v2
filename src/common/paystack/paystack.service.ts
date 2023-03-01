import axios from 'axios';
import config from '../../config';
import { AttachAccountDto } from '../dto';

export class PaystackActions {
  addSubaccount = async (info: AttachAccountDto): Promise<any> => {


    let response = await axios({
      method: 'post',
      url: 'https://api.paystack.co/subaccount',
      headers: {
        Authorization: `Bearer ${config.paystack_secret}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(info),
    });

    if (response.status == 201 || response.status == 200) {
      if (response.data.status == true) {
        let addAccountData = response.data;
        return addAccountData;
      }
    } else {
      throw response.data;
    }
  };

  initSubscriptionTransaction = async (data: {
    email: string;
    amount: any;
    plan: string;
  }): Promise<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }> => {
    let payload = {
      ...data,
      channel: [
        'card',
        'bank',
        'ussd',
        'qr',
        'mobile_money',
        'bank_transfer',
        'eft',
      ],
      transaction_charge: 50,
    };
    let response = await axios({
      method: 'post',
      url: 'https://api.paystack.co/transaction/initialize',
      headers: {
        Authorization: `Bearer ${config.paystack_secret}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(payload),
    });

    if (response.data.status == false) {
      throw 'Failed to generate payment link';
    }
    return response.data.data;
  };

  disableSubscriptionTransaction = async (data: {
    code: string;
    email_token: string;
  }): Promise<boolean> => {
    let payload = {
      ...data,
    };
    let response = await axios({
      method: 'post',
      url: 'https://api.paystack.co/subscription/disable',
      headers: {
        Authorization: `Bearer ${config.paystack_secret}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(payload),
    });
    console.log(response.data.data);

    return true;
  };

  initPaymentTransaction = async (data: {
    email: string;
    amount: any;
    subaccount: string;
    meta: Object;
  }): Promise<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }> => {
    let payload = {
      ...data,
      channel: [
        'card',
        'bank',
        'ussd',
        'qr',
        'mobile_money',
        'bank_transfer',
        'eft',
      ],
      transaction_charge: 50,
    };
    let response = await axios({
      method: 'post',
      url: 'https://api.paystack.co/transaction/initialize',
      headers: {
        Authorization: `Bearer ${config.paystack_secret}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(payload),
    });

    if (response.data.status == false) {
      throw 'Failed to generate payment link';
    }
    return response.data.data;
  };

  verifyTransaction = async (REFERENCE: string): Promise<boolean> => {
    let response = await axios({
      method: 'get',
      url: `https://api.paystack.co/transaction/verify/${REFERENCE}`,
      headers: {
        Authorization: `Bearer ${config.paystack_secret}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status == 201 || response.status == 200) {
      if (
        response.data.status == true &&
        response.data.data.status == 'success'
      ) {
        return true;
      }
    } else {
      return false;
    }

    return false;
  };
}

export const paystackActions = new PaystackActions();
