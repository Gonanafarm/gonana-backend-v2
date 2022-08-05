import * as firebase from "firebase-admin";



class Notifications {
    async notifyUser(body: string, email: string, type: "subscription.enabled" | "subscription.closed" | "account.created" | "account.updated" | "account.bank.updated") {
        await firebase.firestore().collection("notifications").add({
            email: email,
            message: body,
            type,
            created_at: Date.now()
        });
    }
}


export const appNotifications = new Notifications();