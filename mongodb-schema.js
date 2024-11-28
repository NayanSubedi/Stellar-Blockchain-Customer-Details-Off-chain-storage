
import { connect, Schema, model } from "mongoose";

const mongoUri = "mongodb://localhost:27017/CustomerCRU";

connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


const customerSchema = new Schema({
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

const Customer = model("Customer", customerSchema);
export default Customer;
