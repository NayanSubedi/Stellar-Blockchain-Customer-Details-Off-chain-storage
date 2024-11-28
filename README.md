# Soroban Project

## Project Structure

This repository uses the recommended structure for a Soroban project:
```text
.
├── contracts
│   └── hello_world
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```
### Key Points:
- New Soroban contracts can be put in `contracts`, each in their own directory. There is already a `hello_world` contract in there to get you started.
- If you initialized this project with any other example contracts via `--with-example`, those contracts will be in the `contracts` directory as well.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.
- Frontend libraries can be added to the top-level directory as well. If you initialized this project with a frontend template via `--frontend-template` you will have those files already included.

Set Up Environment / Project Installation Guide
-----------------------------------------------

Prerequisites
-------------

Before running the application, ensure you have the following installed:

1.  Node.js (v16 or higher)
2.  MongoDB (local instance or cloud-based)
3.  Stellar Account on the Testnet
4.  Stellar Smart Contract deployed with the necessary methods:
    -   `create_customer`
    -   `get_customer_by_id`
    -   `update_customer`

* * * * *

### A) **Environment Setup**


#### 1\. Install Rust

Run the following command to install Rust:

`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

#### 2\. Install Soroban CLI

`cargo install --locked soroban-cli`

For more information, visit the Soroban documentation.

#### 3\. Install Node.js

Make sure Node.js is installed on your system. You can download it from [here](https://nodejs.org/).

#### 4\. Install Freighter Wallet

*   Get the Freighter Wallet extension for your browser.
    
*   After enabling it, go to the **network section** and connect your wallet to the **testnet**.
    

#### 5\. Install wasm32-unknown-unknown Target

Run the following command to add the WebAssembly target:
`rustup target add wasm32-unknown-unknown`

#### 6\. Configure Soroban CLI for Testnet

Configure the Soroban CLI to interact with the testnet using the following command:

`soroban network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"`

### B) **Setting Up the Project**

1.  **Clone the Repository:**

` git clone https://github.com/NayanSubedi/Stellar-customer_CRUD  
cd customer-crud`

Testing and Deploying the Contract
----------------------------------

### 1\. **Generate an Account**

To deploy the contract, you will need an account. You can either use your Freighter Wallet account or generate a new account on the testnet:
`soroban keys generate --global <ACCOUNT_NAME> --network testnet`

To view the public key of the account:

`soroban keys address <ACCOUNT_NAME>`

To view the private key of the account:

`soroban keys show <ACCOUNT_NAME>`

### 2\. **Build the Contract**

To build the smart contract, use the following command:

`soroban contract build`

Alternatively, you can use Cargo directly:

`cargo build --target wasm32-unknown-unknown --release`


### 3\. **Install Optimizer (Optional)**

If you need to optimize the contract, install the optimizer tool with:

`cargo install --locked soroban-cli --features opt`

### 4\. **Optimize the Contract (Optional)**

To optimize the contract for deployment, run the following command:

`soroban contract optimize --wasm target/wasm32-unknown-unknown/release/hello_world.wasm`

### 5\. **Deploy the Contract**

To deploy the contract to the testnet, use the following command:

`stellar contract deploy --wasm target/wasm32-unknown-unknown/release/hello_world.wasm --network testnet --source <ACCOUNT_NAME>`

### 6\. **Invoke Functions from the Smart Contract**

You can invoke functions in the deployed smart contract using the following command format:

`soroban contract invoke \
  --id <DEPLOYED_CONTRACT_ADDRESS> \
  --source <YOUR_ACCOUNT_NAME> \
  --network testnet \
  -- \
  <FUNCTION_NAME> --<FUNCTION_PARAMETER> <ARGUMENT>` 

Below are example commands to invoke different functions in the CustomerContract:

#### 1\. **Create a Customer**

To create a new Customerct:

`soroban contract invoke --id <DEPLOYED_CONTRACT_ADDRESS> --network testnet --source <YOUR_ACCOUNT_NAME> -- create_customer --id <ARGUMENT> --hash <ARGUMENT>`

#### 2\. **Get a customer by ID**

To retrieve a customer by its ID:
`soroban contract invoke --id <DEPLOYED_CONTRACT_ADDRESS> --source <YOUR_ACCOUNT_NAME> --network testnet -- get_customer_by_id --id <ARGUMENT>`


get_all_customers
#### 3\. **Update a customer**

To update an existing customer:

`soroban contract invoke --id <DEPLOYED_CONTRACT_ADDRESS> --source <YOUR_ACCOUNT_NAME> --network testnet -- update_customer --customer_id 1 -id <ARGUMENT> --hash <ARGUMENT>`


Customer Management System with Stellar Integration
===================================================

Environment Variables
---------------------

Create a `.env` file in the root directory with the following keys:

env

`RPC_URL=<Stellar RPC Server URL>
CONTRACT_ADDRESS=<Deployed Stellar Contract Address>
PRIVATE_KEY=<Stellar Private Key>
DEFAULT_CALLER=<Default Public Address>`

* * * * *

Installation
------------

1.  Clone the Repository:

    bash

    Copy code

    `git clone <repository_url>
    cd <repository_folder>`

2.  Install Dependencies:

    bash

    `npm install`

3.  Start MongoDB: Ensure MongoDB is running locally or configure the connection string in the code.

4.  Run the Server:

    bash

    Copy code

    `node index.js`

5.  API Server Running: The API will be available at `http://localhost:3000`.

* * * * *

API Endpoints
-------------

### 1\. Create Customer

-   URL: `/customers`
-   Method: `POST`
-   Headers:
    -   `Authorization: Bearer <caller_address>` (optional)
-   Body:

    `{
      "name": "John Doe",
      "address": "123 Main St",
      "phone": "1234567890",
      "email": "johndoe@example.com",
      "dob": "1990-01-01",
      "gender": "male",
      "country": "USA"
    }`


### 2\. Retrieve Customer by ID

-   URL: `/customers/:id`
-   Method: `GET`
-   Headers:
    -   `Authorization: Bearer <caller_address>` (optional)
-   Response:

    json

    `{
      "id": "id",
      "hash": "hash_value"
    }`

### 3\. Update Customer

-   URL: `/customers/:id`
-   Method: `PUT`
-   Headers:
    -   `Authorization: Bearer <caller_address>` (optional)
-   Body:

    json

    Copy code

    `{
      "name": "Jane Doe",
      "address": "456 Elm St",
      "phone": "0987654321",
      "email": "janedoe@example.com",
      "dob": "1992-05-15",
      "gender": "female",
      "country": "Canada"
    }`

-   Response:

    json

    Copy code

    `{
      "message": "Customer updated successfully.",
      "newHash": "new_hash_value"
    }`

* * * * *

Stellar Smart Contract Functions
--------------------------------

Ensure your Stellar smart contract includes the following methods:

1.  `create_customer`:

    -   Accepts a customer ID and hash.
    -   Stores the data on the blockchain.
2.  `get_customer_by_id`:

    -   Accepts a customer ID.
    -   Returns the corresponding hash.
3.  `update_customer`:

    -   Accepts a customer ID and a new hash.
    -   Updates the hash on the blockchain.

* * * * *

Error Handling
--------------

-   Missing Parameters: Returns a `400` status with an appropriate message.
-   Database Errors: Logs errors and returns a `500` status.
-   Blockchain Errors: Catches Stellar transaction errors and provides detailed logs.

Conclusion
----------

Following these steps, you will be able to set up, test, and deploy Soroban smart contracts on the testnet. The provided examples demonstrate how to interact with the customerContract, which allows basic CRUD operations on customers.

Make sure to replace placeholders like and with actual values when invoking functions.cct