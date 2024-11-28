#![no_std]

use soroban_sdk::{contracttype, Env, String, log};

#[contracttype]
#[derive(Clone)]
pub struct Customer {
    pub id: String,             
    pub hash: String,
}

use soroban_sdk::{contract, contractimpl};

#[contract]
pub struct CustomerContract;

#[contracttype]
pub enum Customerbook {
    Customer(String), 
}

#[contractimpl]
impl CustomerContract {

    pub fn create_customer(
        env: Env,
        id: String,  
        hash: String,
    ) {
        let new_customer = Customer { id: id.clone(), hash };
    
        env.storage()
            .instance()
            .set(&Customerbook::Customer(id), &new_customer);
    
        log!(&env, "Created new customer with ID: {}", new_customer.id);
        log!(&env, "Customer hash: {}", new_customer.hash);
    }
    

    pub fn get_customer_by_id(env: Env, customer_id: String) -> Customer {
        let key = Customerbook::Customer(customer_id);

        env.storage().instance().get(&key).unwrap_or(Customer {
            id: String::from_str(&env, ""),
            hash: String::from_str(&env, ""),
        })
    }

    pub fn update_customer(
        env: Env,
        customer_id: String,  
        new_hash: Option<String>,
    ) {
        let key = Customerbook::Customer(customer_id.clone());
        let mut customer = Self::get_customer_by_id(env.clone(), customer_id.clone());

        if let Some(hash) = new_hash {
            customer.hash = hash;
        }

        env.storage().instance().set(&key, &customer);

        log!(&env, "Customer with ID: {} has been updated.", customer_id);
    }
}
