import express from 'express';
import pkg from 'body-parser';
import { Contract, rpc, TransactionBuilder, Networks, BASE_FEE, Address, scValToNative, nativeToScVal, Keypair } from '@stellar/stellar-sdk';
import crypto from 'crypto';
const { json } = pkg;
import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const app = express();
const port = 3000;

const mongoUri =  "mongodb://localhost:27017/CustomerCRU";
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


  const customerSchema = new mongoose.Schema({
    rawData: {
      name: String,
      address: String,
      phone: String,
      email: String,
      dob: String,
      gender: String,
      country: String,

    },
    hash: { type: String, required: true },
  });
  
  const Customer = mongoose.model("Customer", customerSchema);
  

const DEFAULT_CALLER = process.env.DEFAULT_CALLER;
const rpcUrl = process.env.RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const stringToScValString = (value) => nativeToScVal(value);

const numberToU64 = (value) => nativeToScVal(value, { type: "u64" });

let params = {
  fee: BASE_FEE,
  networkPassphrase: Networks.TESTNET,
};

async function signTransaction(transactionXDR, privateKey) {
  const keypair = Keypair.fromSecret(privateKey);
  const transaction = TransactionBuilder.fromXDR(transactionXDR, Networks.TESTNET);
  transaction.sign(keypair);
  return transaction.toXDR();
}

async function contractInt(caller, functName, values) {
  const provider = new rpc.Server(rpcUrl, { allowHttp: true });
  const sourceAccount = await provider.getAccount(caller);
  const contract = new Contract(contractAddress);
  let buildTx;

  try {
    if (values == null) {
      buildTx = new TransactionBuilder(sourceAccount, params)
        .addOperation(contract.call(functName))
        .setTimeout(30)
        .build();
    } else if (Array.isArray(values)) {
      buildTx = new TransactionBuilder(sourceAccount, params)
        .addOperation(contract.call(functName, ...values))
        .setTimeout(30)
        .build();
    } else {
      buildTx = new TransactionBuilder(sourceAccount, params)
        .addOperation(contract.call(functName, values))
        .setTimeout(30)
        .build();
    }

    console.log("Transaction prepared:", buildTx);

    let _buildTx = await provider.prepareTransaction(buildTx);
    let prepareTx = _buildTx.toXDR();
    console.log("Prepared XDR:", prepareTx);

    let signedTx = await signTransaction(prepareTx, PRIVATE_KEY);
    let tx = TransactionBuilder.fromXDR(signedTx, Networks.TESTNET);

    let sendTx = await provider.sendTransaction(tx);
    console.log("Transaction sent:", sendTx);

    if (sendTx.errorResult) {
      console.error("Error result from transaction:", sendTx.errorResult);
      throw new Error("Unable to submit transaction");
    }

    if (sendTx.status === "PENDING") {
      let txResponse = await provider.getTransaction(sendTx.hash);
      while (txResponse.status === "NOT_FOUND") {
        txResponse = await provider.getTransaction(sendTx.hash);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (txResponse.status === "SUCCESS") {
        console.log("Full transaction response:", txResponse);
        let result = txResponse.returnValue;
        console.log("Raw result from contract:", result);
        return result;
      } else {
        console.error("Transaction failed:", txResponse);
        throw new Error("Transaction failed");
      }
    }
  } catch (err) {
    console.log("Error in contractInt:", err);
    throw err;
  }
}

app.use(json());

function getCaller(req) {
  const callerFromHeader = req.headers['authorization']?.split(' ')[1];
  const callerFromQuery = req.query.caller;
  return callerFromHeader || callerFromQuery || DEFAULT_CALLER;
}

app.post('/customers', async (req, res) => {
  const { name, address, phone, email, dob, gender, country } = req.body;
  const caller = getCaller(req);

  if (!name || !address || !phone || !email || !dob || !gender || !country) {
    return res.status(400).send("Missing required parameters");
  }

  const rawData = { name, address, phone, email, dob, gender, country };
  const dataString = JSON.stringify(rawData);
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');

  console.log("Generated hash:", hash);

  try {

    const newCustomer = new Customer({ rawData, hash });
    const savedCustomer = await newCustomer.save();
    const customerId = savedCustomer._id.toString();

    console.log("Generated MongoDB ID:", customerId);
    const idScVal = stringToScValString(customerId); 
    const hashScVal = stringToScValString(hash);

    const result = await contractInt(caller, "create_customer", [idScVal, hashScVal]);
    console.log("Result from contract:", result);

    if (result) {
    
      return res.json({
        customerId,
        hash,
        blockchainResponse: result,
      });
    } else {
      return res.status(500).send("No response from the blockchain");
    }
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).send("Error creating customer: " + error.message);
  }
});


const parseScVal = (scVal) => {
  if (!scVal) return undefined;

  switch (scVal.switch().name) {
    case "string":
      return scVal.str().toString();
    case "symbol":
      return scVal.sym().toString();
    case "vec":
      return scVal.vec().map(item => parseScVal(item));
    case "map": {
      const result = {};
      scVal.map().forEach(entry => {
        const key = parseScVal(entry.key());
        const value = parseScVal(entry.val());
        result[key] = value;
      });
      return result;
    }
    default:
      return scValToNative(scVal);
  }
};


app.get('/customers/:id', async (req, res) => {
  const customerId = req.params.id;
  const caller = getCaller(req);
  
  if (!customerId) {
    return res.status(400).send("Missing required parameter: customerId");
  }

  try {
    const contractResult = await contractInt(
      caller,
      "get_customer_by_id",
      [stringToScValString(customerId)] 
    );

    if (!contractResult) {
      return res.status(404).send("Customer hash not found on blockchain");
    }

    const customerData = parseScVal(contractResult);
    
    if (!customerData || !customerData.hash) {
      return res.status(404).send("Customer hash not found in contract response");
    }

    const dbCustomer = await Customer.findOne({ 
      _id: customerId, 
      hash: customerData.hash 
    });

    if (!dbCustomer) {
      return res.status(404).send("Customer not found in database");
    }

    res.json({
      id: customerId,
      hash: customerData.hash
    });

  } catch (error) {
    console.error("Error retrieving customer:", error);
    res.status(500).send('Error retrieving customer: ${error.message}');
  }
});


app.put('/customers/:id', async (req, res) => {
    const customerId = req.params.id;
    const { name, address, phone, email, dob, gender, country } = req.body;
    const caller = getCaller(req);
  
    if (!customerId) {
      return res.status(400).send("Missing required parameter: customerId");
    }
  
    let rawData = { name, address, phone, email, dob, gender, country };
    const dataString = JSON.stringify(rawData);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
  
    console.log("Generated new hash:", hash);
  
    let hashScVal = stringToScValString(hash);
  
    try {
    
      const existingCustomer = await Customer.findById(customerId);
      if (!existingCustomer) {
        return res.status(404).send("Customer not found");
      }
  
      console.log("Existing customer data:", existingCustomer);
  
     
      const updatedCustomer = await Customer.findByIdAndUpdate(
        customerId,
        { $set: { rawData, hash } }, 
        { new: true } 
      );
  
      console.log("Updated customer data:", updatedCustomer);

      await contractInt(caller, "update_customer", [
        stringToScValString(customerId),
        hashScVal,
      ]);
  

      res.json({
        message: "Customer updated successfully.",

        newHash: hash, 
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).send("Error updating customer: " + error.message);
    }
  });
  
  



app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});