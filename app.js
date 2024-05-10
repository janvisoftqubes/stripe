// app.js

const express = require("express");
const bodyParser = require("body-parser");

const path = require("path");
const stripe = require("stripe")(
  "sk_test_51OoJ9LSASGjb3zqkmfLag33XI9suJ9eiJbJ2jrVtVulMLk7TA0LQvOMPCDKdcZnV7ToLvxcGoew16XunAiXRmOJE00dSzWxDU7"
);
require("text-encoding");
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.url.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript");
  }
  next();
});

// Route to handle creating a product
app.post("/create-product", async (req, res) => {
  try {
    const product = await stripe.products.create({
      name: req.body.name,
      type: req.body.type,
    });

    res.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle creating a subscription
app.post("/create-subscription", async (req, res) => {
  try {
    // Tokenize the payment method details provided by the client
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: req.body.token,
      },
    });

    // Create a customer and attach the PaymentMethod
    const customer = await stripe.customers.create({
      email: req.body.email,
      payment_method: paymentMethod.id,
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Set the customer's default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Create a subscription for the customer
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: req.body.priceId }],
      expand: ["latest_invoice.payment_intent"],
    });

    console.log("Subscription created:", subscription);

    res.json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle creating a price
app.post("/create-price", async (req, res) => {
  try {
    const price = await stripe.prices.create({
      product: req.body.productId,
      unit_amount: req.body.unitAmount,
      currency: req.body.currency,
      recurring: { interval: req.body.interval },
      nickname: req.body.nickname,
    });

    res.json(price);
  } catch (error) {
    console.error("Error creating price:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to handle listing products with prices
app.get("/list-products", async (req, res) => {
  try {
    const products = await stripe.products.list({ active: true });
    const productsWithPrices = [];

    for await (const product of products.data) {
      const prices = await stripe.prices.list({ product: product.id });
      productsWithPrices.push({
        product,
        prices: prices.data,
      });
    }

    res.json(productsWithPrices);
  } catch (error) {
    console.error("Error listing products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/webhook", bodyParser.json(), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const payload = req.body;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      JSON.stringify(payload),
      sig,
      "your_webhook_signing_secret"
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      // Handle successful payment intent
      console.log("PaymentIntent succeeded:", event.data.object);
      break;
    case "payment_intent.requires_action":
      // Handle payment intent requiring action (e.g., 3D Secure authentication)
      console.log("PaymentIntent requires action:", event.data.object);
      break;
    case "customer.subscription.created":
      // Handle subscription created event
      console.log("Subscription created:", event.data.object);
      break;
    case "customer.subscription.updated":
      // Handle subscription updated event
      console.log("Subscription updated:", event.data.object);
      // Check if the subscription status is "complete"
      if (event.data.object.status === "complete") {
        console.log("Subscription is complete!");
        // Perform any additional actions you need
      }
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

async function createPaymentMethod(cardDetails) {
  try {
    // Create a new payment method object and tokenize the payment method details
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: cardDetails.number,
        exp_month: cardDetails.expMonth,
        exp_year: cardDetails.expYear,
        cvc: cardDetails.cvc,
      },
    });

    // Return the payment method ID
    return paymentMethod.id;
  } catch (error) {
    console.error("Error creating payment method:", error);
    throw error;
  }
}
