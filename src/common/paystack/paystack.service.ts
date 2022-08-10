import axios from "axios";
import { AttachAccountDto } from "../../organisation/organisation.dto";
const SEC_KEY = "Bearer sk_test_38b346b48237c58df454d070f9dda48f61d83114"

export class PaystackActions {

    addSubaccount = async (info: AttachAccountDto): Promise<any> => {
        info.percentage_charge = 30;
        if (process.env.NODE_ENV !== "production") {
            info.business_name = "10x store",
                info.settlement_bank = "033",
                info.account_number = "2204577180",
                info.percentage_charge = 20
        }

        let response = await axios({
            method: "post",
            url: "https://api.paystack.co/subaccount",
            headers: {
                'Authorization': process.env.sk_live_paystack ?? SEC_KEY,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(info)
        });

        if (response.status == 201 || response.status == 200) {
            if (response.data.status == true) {
                let addAccountData = response.data;
                return addAccountData;
            }
        } else {
            throw response.data;
        }

    }

    initSubscriptionTransaction = async (data:
        {
            email: string,
            amount: any,
            plan: string
        }
    ): Promise<{
        authorization_url: string;
        access_code: string;
        reference: string;
    }> => {

        let response = await axios({
            method: "post",
            url: "https://api.paystack.co/transaction/initialize",
            headers: {
                'Authorization': process.env.sk_live_paystack ?? SEC_KEY,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        });

        console.log(response);

        let initData: {
            authorization_url: string;
            access_code: string;
            reference: string;
        } = response.data

        return initData;
    }

    verifyTransaction = async (REFERENCE: string): Promise<boolean> => {
        let response = await axios({
            method: "get",
            url: `https://api.paystack.co/transaction/verify/${REFERENCE}`,
            headers: {
                'Authorization': process.env.sk_live_paystack ?? SEC_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.status == 201 || response.status == 200) {
            if (response.data.status == true && response.data.data.status == "success") {
                return true;
            }
        } else {
            return false;
        }

        return false;
    }
}


export const paystackActions = new PaystackActions()