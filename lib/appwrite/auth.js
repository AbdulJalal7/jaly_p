
import { Client, Account, ID, Models } from 'react-native-appwrite';
import client from "./client";

class AuthService {
  account = new Account(client);

  async createAccount({ email, password, name,phone }) {
    await this.account.create(ID.unique(), email, password, name);
    await this.login({ email, password });
    console.log("PPPhone :",phone)
    const result = await this.account.updatePhone({
    phone: phone,
    password: password
});
  console.log(result);
  }

  async login({ email, password }) {
    return this.account.createEmailPasswordSession(email, password);
  }
}

export default new AuthService();
