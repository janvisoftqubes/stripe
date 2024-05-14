// // app.js

// const express = require("express");
// const bodyParser = require("body-parser");

// const path = require("path");
// const stripe = require("stripe")(
//   "sk_test_51OoJ9LSASGjb3zqkmfLag33XI9suJ9eiJbJ2jrVtVulMLk7TA0LQvOMPCDKdcZnV7ToLvxcGoew16XunAiXRmOJE00dSzWxDU7"
// );
// require("text-encoding");
// const app = express();
// const port = 3000;

// app.use(
//   bodyParser.json({
//     verify: function (req, res, buf) {
//       req.rawBody = buf;
//     },
//   })
// );

// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use((req, res, next) => {
//   if (req.url.endsWith(".js")) {
//     res.setHeader("Content-Type", "application/javascript");
//   }
//   next();
// });

// // Route to handle creating a product
// app.post("/create-product", async (req, res) => {
//   try {
//     const product = await stripe.products.create({
//       name: req.body.name,
//       type: req.body.type,
//     });

//     res.json(product);
//   } catch (error) {
//     console.error("Error creating product:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // Route to handle creating a subscription
// app.post("/create-subscription", async (req, res) => {
//   try {
//     // Tokenize the payment method details provided by the client
//     const paymentMethod = await stripe.paymentMethods.create({
//       type: "card",
//       card: {
//         token: req.body.token,
//       },
//     });

//     // Create a customer and attach the PaymentMethod
//     const customer = await stripe.customers.create({
//       email: req.body.email,
//       payment_method: paymentMethod.id,
//       invoice_settings: {
//         default_payment_method: paymentMethod.id,
//       },
//     });

//     // Set the customer's default payment method
//     await stripe.customers.update(customer.id, {
//       invoice_settings: {
//         default_payment_method: paymentMethod.id,
//       },
//     });

//     // Create a subscription for the customer
//     const subscription = await stripe.subscriptions.create({
//       customer: customer.id,
//       items: [{ price: req.body.priceId }],
//       expand: ["latest_invoice.payment_intent"],
//       default_payment_method: paymentMethod.id,
//     });

//     console.log("Subscription created:--->", subscription);

//     res.json(subscription);
//   } catch (error) {
//     console.error("Error creating subscription:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // Route to handle creating a price
// app.post("/create-price", async (req, res) => {
//   try {
//     const price = await stripe.prices.create({
//       product: req.body.productId,
//       unit_amount: req.body.unitAmount,
//       currency: req.body.currency,
//       recurring: { interval: req.body.interval },
//       nickname: req.body.nickname,
//     });

//     res.json(price);
//   } catch (error) {
//     console.error("Error creating price:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // Route to handle listing products with prices
// app.get("/list-products", async (req, res) => {
//   try {
//     const products = await stripe.products.list({ active: true });
//     const productsWithPrices = [];

//     for await (const product of products.data) {
//       const prices = await stripe.prices.list({ product: product.id });
//       productsWithPrices.push({
//         product,
//         prices: prices.data,
//       });
//     }

//     res.json(productsWithPrices);
//   } catch (error) {
//     console.error("Error listing products:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// app.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   async (request, response) => {
//     let event;
//     const rawBody = request.rawBody;

//     const endpointSecret = "whsec_DydxF70pzUq2mdXMC5qUCwGIIpPWN2Je";

//     if (endpointSecret) {
//       const signature = request.headers["stripe-signature"];
//       console.log("signature ::", signature);
//       try {
//         console.log("request.body::", request.rawBody);
//         event = stripe.webhooks.constructEvent(
//           rawBody,
//           signature,
//           endpointSecret
//         );
//       } catch (err) {
//         console.error("Webhook error:", err);
//         return response.status(400).send(`Webhook Error: ${err.message}`);
//       }
//     }

//     // Handle the event
//     switch (event.type) {
//       case "payment_intent.succeeded":
//         // Handle successful payment intent
//         console.log("PaymentIntent succeeded:", event.data.object);
//         break;

//       case "customer.subscription.created":
//         // Handle subscription created event
//         console.log("Subscription created:", event.data.object);
//         try {
//           const subscription = await retrieveSubscription(event.data.object.id);
//           console.log("Retrieved subscription details:", subscription);
//         } catch (error) {
//           console.error("Error retrieving subscription details:", error);
//         }
//         break;
//       case "payment_intent.requires_action":
//         // Handle payment intent requiring action (e.g., 3D Secure authentication)
//         console.log("PaymentIntent requires action:", event.data.object);
//         const paymentIntent = event.data.object;
//         // Retrieve the client secret from the PaymentIntent
//         const clientSecret = paymentIntent.client_secret;

//         // Respond to the client with the client secret
//         response.json({ client_secret: clientSecret });
//         break;
//       case "invoice.payment_succeeded":
//         // Handle invoice payment succeeded event
//         console.log("Invoice payment succeeded:", event.data.object);
//         // Check if the invoice payment is for a subscription
//         if (event.data.object.subscription) {
//           // Check if the subscription's status is "complete"
//           if (event.data.object.subscription.status === "complete") {
//             console.log("Subscription payment is complete!");
//             // Perform any additional actions you need
//           }
//         }

//         break;
//       case "customer.subscription.updated":
//         // Handle subscription updated event
//         console.log("Subscription updated:", event.data.object);
//         // Check if the subscription status is "complete"
//         if (event.data.object.status === "complete") {
//           console.log("Subscription is complete!");
//           // Perform any additional actions you need
//         }
//         break;
//       default:
//         // Unexpected event type
//         console.log(`Unhandled event type: ${event.type}`);
//     }

//     // Return a response to acknowledge receipt of the event
//      return response.json({ received: true });
//   }
// );

// app.post("/create-checkout-session", async (req, res) => {
//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [{
//         price: req.body.priceId, // Use the price ID provided in the request
//         quantity: 1,
//       }],
//       mode: 'payment',
//       success_url: 'https://stripe-2.onrender.com/success.html',
//       cancel_url: 'https://stripe-2.onrender.com/cancel.html',
//     });
//     // If the session creation is successful, redirect to success URL
//     res.redirect(session.url);
//   } catch (error) {
//     console.error("Error creating checkout session:", error);
//     // If there's an error, redirect to cancel URL
//     res.redirect('https://stripe-2.onrender.com/cancel.html');
//   }
// });

// app.listen(port, () => {
//   console.log(`Server is listening at http://localhost:${port}`);
// });

// async function retrieveSubscription(subscriptionId) {
//   try {
//     const subscription = await stripe.subscriptions.retrieve(subscriptionId);
//     console.log("Subscription details:", subscription);
//     return subscription;
//   } catch (error) {
//     console.error("Error retrieving subscription:", error);
//     throw error;
//   }
// }
// async function createPaymentMethod(cardDetails) {
//   try {
//     // Create a new payment method object and tokenize the payment method details
//     const paymentMethod = await stripe.paymentMethods.create({
//       type: "card",
//       card: {
//         number: cardDetails.number,
//         exp_month: cardDetails.expMonth,
//         exp_year: cardDetails.expYear,
//         cvc: cardDetails.cvc,
//       },
//     });

//     // Return the payment method ID
//     return paymentMethod.id;
//   } catch (error) {
//     console.error("Error creating payment method:", error);
//     throw error;
//   }
// }

//--->
// const stripe = require("stripe")("your_stripe_secret_key");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;
const path = require("path");
const stripe = require("stripe")(
  "sk_test_51OoJ9LSASGjb3zqkmfLag33XI9suJ9eiJbJ2jrVtVulMLk7TA0LQvOMPCDKdcZnV7ToLvxcGoew16XunAiXRmOJE00dSzWxDU7"
);
require("text-encoding");

app.use(
  bodyParser.json({
    verify: function (req, res, buf) {
      req.rawBody = buf;
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  if (req.url.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript");
  }
  next();
});

// Endpoint to handle webhook events from Stripe
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;
    const rawBody = req.rawBody;

    const endpointSecret = "whsec_DydxF70pzUq2mdXMC5qUCwGIIpPWN2Je";
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        req.headers["stripe-signature"],
        endpointSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed.", err.message);
      return res.sendStatus(400);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        // Handle successful payment intent
        console.log("Payment intent succeeded:", event.data.object);
        break;
      case "invoice.payment_succeeded":
        // Handle successful invoice payment
        console.log("Invoice payment succeeded:", event.data.object);
        break;
      case "checkout.session.completed":
        // Handle completed checkout session
        console.log("Checkout session completed:", event.data.object);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }

    res.sendStatus(200);
  }
);

// Create Customer API endpoint
app.post("/api/create-customer", async (req, res) => {
  const { email } = req.body;

  try {
    const customer = await stripe.customers.create({
      email: email,
    });
    res.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Create Payment Method API endpoint
app.post("/api/create-payment-method", async (req, res) => {
  const { paymentMethodType, paymentMethodToken } = req.body;

  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: paymentMethodType,
      card: {
        token: paymentMethodToken, // Use the test token provided by Stripe
      },
    });
    res.json(paymentMethod);
  } catch (error) {
    console.error("Error creating payment method:", error);
    res.status(500).json({ error: "Failed to create payment method" });
  }
});

// Attach Payment Method to Customer API endpoint
app.post("/api/attach-payment-method", async (req, res) => {
  const { paymentMethodId, customerId } = req.body;
  console.log("req.body==>", req.body);
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    res.sendStatus(200);
  } catch (error) {
    console.error("Error attaching payment method to customer:", error);
    res
      .status(500)
      .json({ error: "Failed to attach payment method to customer" });
  }
});

// Create Subscription API endpoint
app.post("/api/create-subscription", async (req, res) => {
  const { customerId, paymentMethodId, priceId } = req.body;

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
    });
    res.json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// Create Checkout Session API endpoint
app.post("/api/create-checkout-session", async (req, res) => {
  const { customerId, priceId, successUrl, cancelUrl } = req.body;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    const hasPaymentMethod =
      customer.invoice_settings.default_payment_method !== null;

    if (hasPaymentMethod) {
      // If the customer has a payment method attached, create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method:
          customer.invoice_settings.default_payment_method,
      });
      res.json(subscription);
    } else {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      res.json(session);
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
