import * as firebase from "firebase-admin";

class Notifications {
  async notifyUser(
    body: string,
    email: string,
    type:
      | "account.updated"
      | "wallet.created"
      | "wallet.sent"
      | "wallet.received"
      | "wallet.funded",
  ) {
    await firebase.firestore().collection("notifications").add({
      email: email,
      message: body,
      type,
      created_at: Date.now(),
    });
  }
}

export const appNotifications = new Notifications();
