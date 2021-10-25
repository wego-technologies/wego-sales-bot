import { Stripe } from "stripe";


export var clients : Stripe.Response<Stripe.ApiList<Stripe.Customer>>

export async function updateCustomers(stripe: Stripe) {
  console.log("Updating clients...");
  
  clients = await stripe.customers.list({limit: 100});

  console.log("Update complete!");
  
}

export async function getCustomers(stripe : Stripe) {
  if (clients == undefined) {
    console.log("Empty clients list! Pre-filling with a few clients");
    clients = await stripe.customers.list({limit:30});
  }
  return clients
}