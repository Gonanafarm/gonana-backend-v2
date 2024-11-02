import {
  AccountAddress,
  AccountTransaction,
  AccountTransactionHeader,
  AccountTransactionType,
  CcdAmount,
  ConcordiumGRPCClient,
  ModuleReference,
  TransactionExpiry,
  UpdateContractPayload,
  buildBasicAccountSigner,
  createConcordiumClient,
  ContractAddress,
  deserializeReceiveReturnValue,
  serializeUpdateContractParameters,
  signTransaction,
  unwrap,
} from "@concordium/node-sdk";
import {credentials} from "@grpc/grpc-js";
import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import * as sodium from "libsodium-wrappers";
import {User, UserDocument} from "./user.schema";
import {Model} from "mongoose";
@Injectable()
export class ConcordiumService {
  private client: ConcordiumGRPCClient;
  private sender: string;
  private signingKey: string;
  private moduleRef: string;
  private contractIndex: bigint;
  private contractSubindex: bigint;
  constructor(
    //@ts-ignore
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    const address = "grpc.mainnet.concordium.software"; // mainnet
    //const address = "node.testnet.concordium.com"; // testnet

    const port = 20000;
    // const security = environment.concordiumAdmin.environment === 'Mainnet' ? credentials.createSsl() : credentials.createInsecure();
    const security = credentials.createSsl(); //mainnet
    // const security = credentials.createInsecure(); //testnet
    this.client = createConcordiumClient(address, Number(port), security, {
      timeout: 15000000,
    });

    this.sender = "4Csb9ANHnt8Kqy5WLgbFQyyJSBb9wuW7QXLweQ2A6zDBgHpyV3";
    this.signingKey =
      "c85e8bd69b3f592c69d4c4a36a74e8c2c315cb48b63baa35e141e5566ba516ad";
    this.moduleRef =
      "9c41b5b9dbca53667839e041c9ede71ded569752196411e0bfa5648cad821c94";
    this.contractIndex = BigInt(9645);
    this.contractSubindex = BigInt(0);
  }

  public async generateKeyPair() {
    await sodium.ready;
    const keyPair = sodium.crypto_sign_keypair();
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.privateKey;
    return {
      publicKey: Buffer.from(publicKey).toString("hex"),
      privateKey: Buffer.from(privateKey).toString("hex"),
    };
  }

  public async getOrCreateConcordiumKeyPairs(id: string) {
    if (!id) {
      throw new BadRequestException("Login and Try again");
    }
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (
      user.ccd_wallet_address === undefined ||
      user.ccd_wallet_address === null
    ) {
      const keys = await this.generateKeyPair();
      user.ccd_wallet_address = keys.publicKey;
      user.ccdPrivateKey = keys.privateKey;
      await user.save();
      // console.log({keys})
      return {
        publicKey: user.ccd_wallet_address,
        privateKey: user.ccdPrivateKey,
      };
    }
    return {
      publicKey: user.ccd_wallet_address,
      privateKey: user.ccdPrivateKey,
    };
  }

  async ccdBalanceOf(id: string) {
    const wallet = await this.getOrCreateConcordiumKeyPairs(id);

    const invoker = new AccountAddress(this.sender);
    try {
      const contractAddress = {
        index: this.contractIndex,
        subindex: this.contractSubindex,
      };
      const receiveName = "gonana_smart_wallet.ccdBalanceOf";

      const moduleRef = new ModuleReference(
        "9c41b5b9dbca53667839e041c9ede71ded569752196411e0bfa5648cad821c94",
      );
      const schema = await this.client.getEmbeddedSchema(moduleRef);

      // Serialize the parameters
      const serializedParams = serializeUpdateContractParameters(
        "gonana_smart_wallet",
        "ccdBalanceOf",
        [wallet.publicKey],
        schema,
      );

      // Invoke the contract
      const result = await this.client.invokeContract({
        contract: unwrap(contractAddress),
        invoker,
        method: "gonana_smart_wallet.ccdBalanceOf",
        parameter: serializedParams,
      });

      // Deserialize the response

      const decodedResult = deserializeReceiveReturnValue(
        // @ts-ignore
        result.returnValue,
        schema,
        "gonana_smart_wallet",
        "ccdBalanceOf",
      );

      const fakeBalance = parseInt(decodedResult[0]);
      const balance = fakeBalance / 1e6;

      return balance;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || 400,
      );
    }
  }

  async deposit(amount: number, id: string) {
    const contractAddress = {
      index: this.contractIndex,
      subindex: this.contractSubindex,
    };

    const wallet = await this.getOrCreateConcordiumKeyPairs(id);
    const sender = new AccountAddress(this.sender);
    const signer = buildBasicAccountSigner(this.signingKey);
    const moduleRef = new ModuleReference(this.moduleRef);
    const schema = await this.client.getEmbeddedSchema(moduleRef);
    const maxCost = BigInt(30000);
    const contractName = "gonana_smart_wallet";
    const receiveName = "gonana_smart_wallet.depositCcd";

    const param = wallet.publicKey;

    const updateHeader: AccountTransactionHeader = {
      // @ts-ignore
      expiry: await this.getDefaultTransactionExpiry(),
      nonce: (await this.client.getNextAccountNonce(sender)).nonce,
      sender,
    };

    const updateParams = serializeUpdateContractParameters(
      contractName,
      "depositCcd",
      param,
      schema,
    );
    console.log({updateHeader, updateParams});

    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(amount * 10 ** 6),
      address: unwrap(contractAddress),
      receiveName,
      message: updateParams,
      maxContractExecutionEnergy: maxCost,
    };

    console.log({updatePayload});
    const updateTransaction: AccountTransaction = {
      header: updateHeader,
      payload: updatePayload,
      type: AccountTransactionType.Update,
    };

    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await this.client.sendAccountTransaction(
      updateTransaction,
      updateSignature,
    );
    console.log("Transaction submitted, waiting for finalization...");
    const updateStatus = await this.client.waitForTransactionFinalization(
      updateTrxHash,
    );
    console.dir(updateStatus, {depth: null, colors: true});

    return updateTrxHash;
  }

  async transferCcd(amount: number, recipient: string, id: string) {
    try {
      const contractAddress = {
        index: this.contractIndex,
        subindex: this.contractSubindex,
      };
      const sender = new AccountAddress(this.sender);
      const signer = buildBasicAccountSigner(this.signingKey);
      const moduleRef = new ModuleReference(this.moduleRef);
      const schema = await this.client.getEmbeddedSchema(moduleRef);

      const maxCost = BigInt(30000);
      const contractName = "gonana_smart_wallet";
      const receiveName = "gonana_smart_wallet.transferCcd";

      // const wallet = {
      //     publicKey: "a6c22f4e0d5e48ddd5166a992773e2d12e0891727884859d32fcaeae72ba4c9a",
      //     privateKey: "ab3f16cf72ca060c50daf5b6dbc927b48aa306274c88f4681b529648f6ce1614a6c22f4e0d5e48ddd5166a992773e2d12e0891727884859d32fcaeae72ba4c9a"
      // }
      const wallet = await this.getOrCreateConcordiumKeyPairs(id);
      const nonce = (await this.nonceOf(wallet.publicKey))[0];

      console.log({nonce});
      const expiry_time = await this.getExpiryTime();
      const message = {
        entry_point: "transferCcd",
        expiry_time,
        nonce,
        service_fee_amount: new CcdAmount(0),
        service_fee_recipient:
          "b288c8518c8be158e5e22cb1ee8c748b1992a2cb3572643a7b6ceb1ccd6bf3ec",
        simple_transfers: [
          {
            to: recipient,
            transfer_amount: new CcdAmount(amount * 10 ** 6),
          },
        ],
      };

      const messageHash = await this.getCcdTransferMessageHash(message);
      console.log({messageHash});
      console.log(wallet);

      const messageHashBin = this.hexToUint8Array(messageHash);
      const privateKeyBin = this.hexToUint8Array(wallet.privateKey);

      const signatureUint8 = sodium.crypto_sign_detached(
        messageHashBin,
        privateKeyBin,
      );
      console.log({signatureUint8});
      const signature = sodium.to_hex(signatureUint8);
      console.log({signature});
      const paramJson = [
        {
          message,
          signature,
          signer: wallet.publicKey,
        },
      ];

      const updateHeader: AccountTransactionHeader = {
        // @ts-ignore
        expiry: await this.getDefaultTransactionExpiry(),
        nonce: (await this.client.getNextAccountNonce(sender)).nonce,
        sender,
      };

      const updateParams = serializeUpdateContractParameters(
        contractName,
        "transferCcd",
        paramJson,
        schema,
      );
      console.log({updateHeader, updateParams});
      const updatePayload: UpdateContractPayload = {
        amount: new CcdAmount(0),
        address: unwrap(contractAddress),
        receiveName,
        message: updateParams,
        maxContractExecutionEnergy: maxCost,
      };

      console.log({updatePayload});
      const updateTransaction: AccountTransaction = {
        header: updateHeader,
        payload: updatePayload,
        type: AccountTransactionType.Update,
      };

      const updateSignature = await signTransaction(updateTransaction, signer);
      const updateTrxHash = await this.client.sendAccountTransaction(
        updateTransaction,
        updateSignature,
      );
      console.log("Transaction submitted, waiting for finalization...");
      const updateStatus = await this.client.waitForTransactionFinalization(
        updateTrxHash,
      );
      //  console.dir(updateStatus, {depth: null, colors: true});
      if (
        //@ts-ignore
        updateStatus.summary.transactionType &&
        //@ts-ignore
        updateStatus.summary.transactionType === "failed"
      ) {
        throw new BadRequestException("Transaction failed");
      }

      return updateTrxHash;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || 400,
      );
    }
  }

  async withdrawCcd(amount: number, recipient: string, id: string) {
    const contractAddress = {
      index: this.contractIndex,
      subindex: this.contractSubindex,
    };
    const sender = new AccountAddress(this.sender);
    const signer = buildBasicAccountSigner(this.signingKey);
    const moduleRef = new ModuleReference(this.moduleRef);
    const schema = await this.client.getEmbeddedSchema(moduleRef);

    const maxCost = BigInt(30000);
    const contractName = "gonana_smart_wallet";
    const receiveName = "gonana_smart_wallet.withdrawCcd";

    const wallet = await this.getOrCreateConcordiumKeyPairs(id);

    const nonce = (await this.nonceOf(wallet.publicKey))[0];

    console.log({nonce});
    const expiry_time = await this.getExpiryTime();
    const message = {
      entry_point: "withdrawCcd",
      expiry_time,
      nonce,
      service_fee_amount: new CcdAmount(0),
      service_fee_recipient:
        "b288c8518c8be158e5e22cb1ee8c748b1992a2cb3572643a7b6ceb1ccd6bf3ec",
      simple_withdraws: [
        {
          to: {
            Account: [recipient],
          },
          withdraw_amount: new CcdAmount(amount * 10 ** 6),
          data: wallet.publicKey,
        },
      ],
    };

    const messageHash = await this.getCcdWithdrawMessageHash(message);
    console.log({messageHash});
    // const privateKeyUint = sodium.from_hex(wallet.privateKey)
    const messageHashBin = this.hexToUint8Array(messageHash);

    // const messageHashBin = sodium.hex2bin();
    const privateKeyBin = this.hexToUint8Array(wallet.privateKey);

    const signatureUint8 = sodium.crypto_sign_detached(
      messageHashBin,
      privateKeyBin,
    );
    console.log({signatureUint8});
    const signature = sodium.to_hex(signatureUint8);
    console.log({signature});
    console.log({timeAfter: expiry_time});
    const paramJson = [
      {
        message,
        signature,
        signer: wallet.publicKey,
      },
    ];

    const updateHeader: AccountTransactionHeader = {
      // @ts-ignore
      expiry: await this.getDefaultTransactionExpiry(),
      nonce: (await this.client.getNextAccountNonce(sender)).nonce,
      sender,
    };

    const updateParams = serializeUpdateContractParameters(
      contractName,
      "withdrawCcd",
      paramJson,
      schema,
    );
    console.log({updateHeader, updateParams});

    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(0),
      address: unwrap(contractAddress),
      receiveName,
      message: updateParams,
      maxContractExecutionEnergy: maxCost,
    };

    console.log({updatePayload});
    const updateTransaction: AccountTransaction = {
      header: updateHeader,
      payload: updatePayload,
      type: AccountTransactionType.Update,
    };

    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await this.client.sendAccountTransaction(
      updateTransaction,
      updateSignature,
    );
    console.log("Transaction submitted, waiting for finalization...");
    const updateStatus = await this.client.waitForTransactionFinalization(
      updateTrxHash,
    );

    if (
      //@ts-ignore
      updateStatus.summary.transactionType &&
      //@ts-ignore
      updateStatus.summary.transactionType === "failed"
    ) {
      console.log(updateStatus.summary);

      throw new BadRequestException("Transaction failed");
    }

    return updateTrxHash;
  }

  async pay(
    amount: number,
    recipient: string,
    id: string,
    transactionId: string,
  ) {
    const wallet = await this.getOrCreateConcordiumKeyPairs(id);
    const contractAddress = {
      index: this.contractIndex,
      subindex: this.contractSubindex,
    };
    const sender = new AccountAddress(this.sender);
    const signer = buildBasicAccountSigner(this.signingKey);
    const moduleRef = new ModuleReference(this.moduleRef);
    const schema = await this.client.getEmbeddedSchema(moduleRef);

    const maxCost = BigInt(30000);
    const contractName = "gonana_smart_wallet";
    const receiveName = "gonana_smart_wallet.withdrawCcd";
    const pay_schema = await this.client.getEmbeddedSchema(
      new ModuleReference(
        "36b3e4ee5cb1666a029005dd284c6fd3389355b5b58a61a8d113ddacc908227e",
      ),
    );
    const data_param = {
      id: transactionId,
      payer: wallet.publicKey,
      receiver: recipient,
    };
    const data_buf = serializeUpdateContractParameters(
      "gonana_escrow",
      "pay",
      data_param,
      pay_schema,
    );
    const data = data_buf.toString("hex");

    const nonce = (await this.nonceOf(wallet.publicKey))[0];

    //console.log({nonce})
    const expiry_time = await this.getExpiryTime();
    const withdraw_amount = Math.round(amount * 0.95);
    const service_fee = amount - withdraw_amount;
    console.log("service_fee", service_fee);
    console.log("withdraw ammount:", withdraw_amount);
    const message = {
      entry_point: "withdrawCcd",
      expiry_time,
      nonce,
      service_fee_amount: new CcdAmount(service_fee),
      service_fee_recipient:
        "9a1ecd9c95dadde885b68b52b3e5fd343f8b8439de547f71f6f1507794a293ee",
      simple_withdraws: [
        {
          data: data,
          to: {
            Contract: [
              {
                index: 9693,
                subindex: 0,
              },
              "pay",
            ],
          },
          withdraw_amount: new CcdAmount(withdraw_amount * 10 ** 6),
        },
      ],
    };

    const messageHash = await this.getCcdWithdrawMessageHash(message);
    // const privateKeyUint = sodium.from_hex(wallet.privateKey)
    const messageHashBin = this.hexToUint8Array(messageHash);

    // const messageHashBin = sodium.hex2bin();
    const privateKeyBin = this.hexToUint8Array(wallet.privateKey);

    const signatureUint8 = sodium.crypto_sign_detached(
      messageHashBin,
      privateKeyBin,
    );
    const signature = sodium.to_hex(signatureUint8);
    const paramJson = [
      {
        message,
        signature,
        signer: wallet.publicKey,
      },
    ];

    const updateHeader: AccountTransactionHeader = {
      // @ts-ignore
      expiry: await this.getDefaultTransactionExpiry(),
      nonce: (await this.client.getNextAccountNonce(sender)).nonce,
      sender,
    };

    const updateParams = serializeUpdateContractParameters(
      contractName,
      "withdrawCcd",
      paramJson,
      schema,
    );
    console.log({updateHeader, updateParams});

    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(0),
      address: unwrap(contractAddress),
      receiveName,
      message: updateParams,
      maxContractExecutionEnergy: maxCost,
    };

    console.log({updatePayload});
    const updateTransaction: AccountTransaction = {
      header: updateHeader,
      payload: updatePayload,
      type: AccountTransactionType.Update,
    };

    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await this.client.sendAccountTransaction(
      updateTransaction,
      updateSignature,
    );
    console.log("Transaction submitted, waiting for finalization...");
    const updateStatus = await this.client.waitForTransactionFinalization(
      updateTrxHash,
    );
    console.dir(updateStatus, {depth: null, colors: true});

    return updateTrxHash;
  }
  ///////////////////////////////////*****HELPER FUNCTIONS*****/////////////////////////////////////////////
  hexToUint8Array(hexString: string) {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
  }

  async withdrawFromEscrow(id: string) {
    const contractAddress = {index: 9693n, subindex: 0n}; // testnet 9985n

    const sender = new AccountAddress(this.sender);
    const signer = buildBasicAccountSigner(this.signingKey);
    const moduleRef = new ModuleReference(
      "36b3e4ee5cb1666a029005dd284c6fd3389355b5b58a61a8d113ddacc908227e",
    );
    const schema = await this.client.getEmbeddedSchema(moduleRef);
    const maxCost = BigInt(30000);
    const contractName = "gonana_escrow";
    const receiveName = "gonana_escrow.withdraw";

    const updateHeader: AccountTransactionHeader = {
      // @ts-ignore
      expiry: await this.getDefaultTransactionExpiry(),
      nonce: (await this.client.getNextAccountNonce(sender)).nonce,
      sender,
    };

    const updateParams = serializeUpdateContractParameters(
      contractName,
      "withdraw",
      id,
      schema,
    );
    console.log({updateHeader, updateParams});

    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(0 * 10 ** 6),
      address: unwrap(contractAddress),
      receiveName,
      message: updateParams,
      maxContractExecutionEnergy: maxCost,
    };

    console.log({updatePayload});
    const updateTransaction: AccountTransaction = {
      header: updateHeader,
      payload: updatePayload,
      type: AccountTransactionType.Update,
    };

    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await this.client.sendAccountTransaction(
      updateTransaction,
      updateSignature,
    );
    console.log("Transaction submitted, waiting for finalization...");
    const updateStatus = await this.client.waitForTransactionFinalization(
      updateTrxHash,
    );
    console.dir(updateStatus, {depth: null, colors: true});

    return updateTrxHash;
  }

  async getCcdTransferMessageHash(message: any) {
    try {
      const contractAddress = {
        index: this.contractIndex,
        subindex: this.contractSubindex,
      };
      const receiveName = "gonana_smart_wallet.getCcdTransferMessageHash";

      const moduleRef = new ModuleReference(this.moduleRef);
      const schema = await this.client.getEmbeddedSchema(moduleRef);
      const invoker = new AccountAddress(this.sender);

      // Serialize the parameters
      const serializedParams = serializeUpdateContractParameters(
        "gonana_smart_wallet",
        "getCcdTransferMessageHash",
        message,
        schema,
      );

      const result = await this.client.invokeContract({
        contract: unwrap(contractAddress),
        invoker,
        method: "gonana_smart_wallet.getCcdTransferMessageHash",
        parameter: serializedParams,
      });

      console.log({result});

      const decodedResult = deserializeReceiveReturnValue(
        // @ts-ignore
        result.returnValue,
        schema,
        "gonana_smart_wallet",
        "getCcdTransferMessageHash",
      );

      console.log({decodedResult});
      // @ts-ignore
      return result.returnValue;
    } catch (error) {
      console.error(error);
    }
  }

  async getCcdWithdrawMessageHash(message: any) {
    try {
      const contractAddress = {
        index: this.contractIndex,
        subindex: this.contractSubindex,
      };
      const receiveName = "gonana_smart_wallet.getCcdWithdrawMessageHash";

      const moduleRef = new ModuleReference(this.moduleRef);
      const schema = await this.client.getEmbeddedSchema(moduleRef);
      const invoker = new AccountAddress(this.sender);

      // Serialize the parameters
      const serializedParams = serializeUpdateContractParameters(
        "gonana_smart_wallet",
        "getCcdWithdrawMessageHash",
        message,
        schema,
      );

      const result = await this.client.invokeContract({
        contract: unwrap(contractAddress),
        invoker,
        method: "gonana_smart_wallet.getCcdWithdrawMessageHash",
        parameter: serializedParams,
      });

      console.log({result});

      const decodedResult = deserializeReceiveReturnValue(
        // @ts-ignore
        result.returnValue,
        schema,
        "gonana_smart_wallet",
        "getCcdWithdrawMessageHash",
      );

      console.log({decodedResult});
      // @ts-ignore
      return result.returnValue;
    } catch (error) {
      console.error(error);
    }
  }

  async nonceOf(publicKey: string) {
    try {
      const contractAddress = {
        index: this.contractIndex,
        subindex: this.contractSubindex,
      };
      const receiveName = "gonana_smart_wallet.nonceOf";

      const moduleRef = new ModuleReference(this.moduleRef);
      const schema = await this.client.getEmbeddedSchema(moduleRef);
      const invoker = new AccountAddress(this.sender);

      // Serialize the parameters
      const serializedParams = serializeUpdateContractParameters(
        "gonana_smart_wallet",
        "nonceOf",
        [publicKey],
        schema,
      );

      const result = await this.client.invokeContract({
        contract: unwrap(contractAddress),
        invoker,
        method: "gonana_smart_wallet.nonceOf",
        parameter: serializedParams,
      });

      console.log({result});

      const decodedResult = deserializeReceiveReturnValue(
        // @ts-ignore
        result.returnValue,
        schema,
        "gonana_smart_wallet",
        "nonceOf",
      );

      console.log({decodedResult});
      return decodedResult;
    } catch (error) {
      console.error(error);
    }
  }
  async getExpiryTime() {
    const currentTime = new Date();
    const expiryTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
    return expiryTime.toISOString(); // Convert to ISO 8601 string
  }
  async getDefaultTransactionExpiry() {
    const DEFAULT_TRANSACTION_EXPIRY = 360000;
    return new TransactionExpiry(
      new Date(Date.now() + DEFAULT_TRANSACTION_EXPIRY),
    );
  }
  async cis2BalanceOf(wallet: string, tokenAddress: any) {
    const invoker = new AccountAddress(this.sender);
    console.log(tokenAddress);
    try {
      const contractAddress = {
        index: this.contractIndex,
        subindex: this.contractSubindex,
      };

      const moduleRef = new ModuleReference(this.moduleRef);
      const schema = await this.client.getEmbeddedSchema(moduleRef);
      const message = {
        token_id: "",
        cis2_token_contract_address: tokenAddress,
        public_key: wallet,
      };
      // Serialize the parameters
      const serializedParams = serializeUpdateContractParameters(
        "gonana_smart_wallet",
        "cis2BalanceOfAccount",
        message,
        schema,
      );
      // Invoke the contract
      const result = await this.client.invokeContract({
        contract: unwrap(contractAddress),
        invoker,
        method: "gonana_smart_wallet.cis2BalanceOfAccount",
        parameter: serializedParams,
      });

      // Deserialize the response
      const decodedResult = deserializeReceiveReturnValue(
        // @ts-ignore
        result.returnValue,
        schema,
        "gonana_smart_wallet",
        "cis2BalanceOfAccount",
      );

      const balance = parseInt(decodedResult) / 1e6;
      return balance;
    } catch (error) {
      console.error(error);
    }
  }

  async depositCis2Token(
    _amount: number,
    id: string,
    tokencontractAddress: ContractAddress,
    tokenModuleRef: string,
  ) {
    const sender = new AccountAddress(this.sender);
    const wallet = await this.getOrCreateConcordiumKeyPairs(id);
    const signer = buildBasicAccountSigner(this.signingKey);
    const schema = await this.client.getEmbeddedSchema(
      new ModuleReference(tokenModuleRef),
    );
    const maxCost = BigInt(30000);
    const contractName = "gona_token";
    const amount = _amount * 10 ** 6;

    const param = {
      amount: amount.toString(),
      data: wallet.publicKey,
      from: {
        Account: [sender],
      },
      to: {
        Contract: [
          {
            index: Number(this.contractIndex),
            subindex: 0,
          },
          "depositCis2Tokens",
        ],
      },
      token_id: "",
    };

    const updateHeader: AccountTransactionHeader = {
      // @ts-ignore
      expiry: await this.getDefaultTransactionExpiry(),
      nonce: (await this.client.getNextAccountNonce(sender)).nonce,
      sender,
    };

    const updateParams = serializeUpdateContractParameters(
      contractName,
      "transfer",
      [param],
      schema,
    );
    console.log({updateHeader, updateParams});

    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(0),
      address: unwrap(tokencontractAddress),
      receiveName: "gona_token.transfer",
      message: updateParams,
      maxContractExecutionEnergy: maxCost,
    };

    console.log({updatePayload});
    const updateTransaction: AccountTransaction = {
      header: updateHeader,
      payload: updatePayload,
      type: AccountTransactionType.Update,
    };

    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await this.client.sendAccountTransaction(
      updateTransaction,
      updateSignature,
    );
    console.log("Transaction submitted, waiting for finalization...");
    const updateStatus = await this.client.waitForTransactionFinalization(
      updateTrxHash,
    );
    console.dir(updateStatus, {depth: null, colors: true});

    return updateTrxHash;
  }

  async transferCis2Token(
    amount: number,
    recipient: string,
    id: string,
    cis2tokenAddress: any,
  ) {
    const contractAddress = {
      index: this.contractIndex,
      subindex: this.contractSubindex,
    };
    const wallet = await this.getOrCreateConcordiumKeyPairs(id);
    const sender = new AccountAddress(this.sender);
    const signer = buildBasicAccountSigner(this.signingKey);
    const moduleRef = new ModuleReference(this.moduleRef);
    const schema = await this.client.getEmbeddedSchema(moduleRef);

    const maxCost = BigInt(30000);
    const contractName = "gonana_smart_wallet";
    const receiveName = "gonana_smart_wallet.transferCis2Tokens";

    const nonce = (await this.nonceOf(wallet.publicKey))[0];

    console.log({nonce});
    const expiry_time = await this.getExpiryTime();
    const message = {
      entry_point: "transferCis2Tokens",
      expiry_time,
      nonce,
      service_fee_recipient:
        "b288c8518c8be158e5e22cb1ee8c748b1992a2cb3572643a7b6ceb1ccd6bf3ec",
      service_fee_amount: {
        token_amount: "0",
        token_id: "",
        cis2_token_contract_address: cis2tokenAddress,
      },
      simple_transfers: [
        {
          to: recipient,
          transfer_amount: {
            token_amount: (amount * 10 ** 6).toString(),
            token_id: "",
            cis2_token_contract_address: cis2tokenAddress,
          },
        },
      ],
    };

    const messageHash = await this.getCis2TransferMessageHash(message);
    //console.log({ messageHash });

    const messageHashBin = this.hexToUint8Array(messageHash);
    const privateKeyBin = this.hexToUint8Array(wallet.privateKey);

    const signatureUint8 = sodium.crypto_sign_detached(
      messageHashBin,
      privateKeyBin,
    );
    //console.log({ signatureUint8 });
    const signature = sodium.to_hex(signatureUint8);
    ///console.log({ signature });
    const paramJson = [
      {
        message,
        signature,
        signer: wallet.publicKey,
      },
    ];

    const updateHeader: AccountTransactionHeader = {
      // @ts-ignore
      expiry: await this.getDefaultTransactionExpiry(),
      nonce: (await this.client.getNextAccountNonce(sender)).nonce,
      sender,
    };

    const updateParams = serializeUpdateContractParameters(
      contractName,
      "transferCis2Tokens",
      paramJson,
      schema,
    );
    //console.log({ updateHeader, updateParams });
    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(0),
      address: unwrap(contractAddress),
      receiveName,
      message: updateParams,
      maxContractExecutionEnergy: maxCost,
    };

    // console.log({ updatePayload });
    const updateTransaction: AccountTransaction = {
      header: updateHeader,
      payload: updatePayload,
      type: AccountTransactionType.Update,
    };
    console.log(this.getDefaultTransactionExpiry());
    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await this.client.sendAccountTransaction(
      updateTransaction,
      updateSignature,
    );
    console.log("Transaction submitted, waiting for finalization...");
    const updateStatus = await this.client.waitForTransactionFinalization(
      updateTrxHash,
    );
    console.dir(updateStatus, {depth: null, colors: true});

    return updateTrxHash;
  }

  async getCis2TransferMessageHash(message: any) {
    try {
      const contractAddress = {
        index: this.contractIndex,
        subindex: this.contractSubindex,
      };
      const moduleRef = new ModuleReference(this.moduleRef);
      const schema = await this.client.getEmbeddedSchema(moduleRef);
      const invoker = new AccountAddress(this.sender);

      // Serialize the parameters
      const serializedParams = serializeUpdateContractParameters(
        "gonana_smart_wallet",
        "getCis2TransferMessageHash",
        message,
        schema,
      );

      const result = await this.client.invokeContract({
        contract: unwrap(contractAddress),
        invoker,
        method: "gonana_smart_wallet.getCis2TransferMessageHash",
        parameter: serializedParams,
      });
      console.log({result});
      const decodedResult = deserializeReceiveReturnValue(
        // @ts-ignore
        result.returnValue,
        schema,
        "gonana_smart_wallet",
        "getCis2TransferMessageHash",
      );

      console.log({decodedResult});
      // @ts-ignore
      return result.returnValue;
    } catch (error) {
      console.error(error);
    }
  }

  async withdrawCis2Token(
    amount: number,
    recipient: string,
    id: string,
    tokenAddress: any,
  ) {
    const contractAddress = {
      index: this.contractIndex,
      subindex: this.contractSubindex,
    };
    const wallet = await this.getOrCreateConcordiumKeyPairs(id);
    const sender = new AccountAddress(this.sender);
    const signer = buildBasicAccountSigner(this.signingKey);
    const moduleRef = new ModuleReference(this.moduleRef);
    const schema = await this.client.getEmbeddedSchema(moduleRef);

    const maxCost = BigInt(30000);
    const contractName = "gonana_smart_wallet";
    const receiveName = "gonana_smart_wallet.withdrawCis2Tokens";

    const nonce = (await this.nonceOf(wallet.publicKey))[0];

    console.log({nonce});
    const expiry_time = await this.getExpiryTime();

    const message = {
      entry_point: "withdrawCis2Tokens",
      expiry_time,
      nonce,
      service_fee_recipient:
        "b288c8518c8be158e5e22cb1ee8c748b1992a2cb3572643a7b6ceb1ccd6bf3ec",
      service_fee_amount: {
        token_amount: "0",
        token_id: "",
        cis2_token_contract_address: tokenAddress,
      },
      simple_withdraws: [
        {
          to: {
            Account: [recipient],
          },
          withdraw_amount: {
            token_amount: (amount * 10 ** 6).toString(),
            token_id: "",
            cis2_token_contract_address: tokenAddress,
          },
          data: "",
        },
      ],
    };

    const messageHash = await this.getCis2WithdrawMessageHash(message);
    // console.log({ messageHash });
    const messageHashBin = this.hexToUint8Array(messageHash);

    const privateKeyBin = this.hexToUint8Array(wallet.privateKey);

    const signatureUint8 = sodium.crypto_sign_detached(
      messageHashBin,
      privateKeyBin,
    );
    const signature = sodium.to_hex(signatureUint8);
    const paramJson = [
      {
        message,
        signature,
        signer: wallet.publicKey,
      },
    ];

    const updateHeader: AccountTransactionHeader = {
      // @ts-ignore
      expiry: await this.getDefaultTransactionExpiry(),
      nonce: (await this.client.getNextAccountNonce(sender)).nonce,
      sender,
    };

    const updateParams = serializeUpdateContractParameters(
      contractName,
      "withdrawCis2Tokens",
      paramJson,
      schema,
    );
    console.log({updateHeader, updateParams});

    const updatePayload: UpdateContractPayload = {
      amount: new CcdAmount(0),
      address: unwrap(contractAddress),
      receiveName,
      message: updateParams,
      maxContractExecutionEnergy: maxCost,
    };

    console.log({updatePayload});
    const updateTransaction: AccountTransaction = {
      header: updateHeader,
      payload: updatePayload,
      type: AccountTransactionType.Update,
    };

    const updateSignature = await signTransaction(updateTransaction, signer);
    const updateTrxHash = await this.client.sendAccountTransaction(
      updateTransaction,
      updateSignature,
    );
    console.log("Transaction submitted, waiting for finalization...");
    const updateStatus = await this.client.waitForTransactionFinalization(
      updateTrxHash,
    );
    console.dir(updateStatus, {depth: null, colors: true});
    //@ts-ignore
    console.log(updateStatus.summary.transactionType);

    return updateTrxHash;
  }

  async getCis2WithdrawMessageHash(message: any) {
    try {
      const contractAddress = {
        index: this.contractIndex,
        subindex: this.contractSubindex,
      };
      const moduleRef = new ModuleReference(this.moduleRef);
      const schema = await this.client.getEmbeddedSchema(moduleRef);
      const invoker = new AccountAddress(this.sender);

      // Serialize the parameters
      const serializedParams = serializeUpdateContractParameters(
        "gonana_smart_wallet",
        "getCis2WithdrawMessageHash",
        message,
        schema,
      );

      const result = await this.client.invokeContract({
        contract: unwrap(contractAddress),
        invoker,
        method: "gonana_smart_wallet.getCis2WithdrawMessageHash",
        parameter: serializedParams,
      });

      console.log({result});

      const decodedResult = deserializeReceiveReturnValue(
        // @ts-ignore
        result.returnValue,
        schema,
        "gonana_smart_wallet",
        "getCis2WithdrawMessageHash",
      );

      console.log({decodedResult});
      // @ts-ignore
      return result.returnValue;
    } catch (error) {
      console.error(error);
    }
  }
}
