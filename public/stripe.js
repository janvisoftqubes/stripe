// Load Stripe.js with your publishable API key
const stripe = Stripe('pk_test_51OoJ9LSASGjb3zqkIbuCwoFz3qsrXCzRHLaIQTwAlP2wf4axwKqsgRQzwBTOCpBcKd2Sidj5ZvQayJa7zp8kSLqu009pC4GBd2');

// Create an instance of Stripe Elements
const elements = stripe.elements();

// Create an instance of the card Element
const cardElement = elements.create('card');

// Mount the card Element to the card-number element in the form
cardElement.mount('#card-number');

// Handle form submission
document.getElementById('subscription-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;

    // Create a token from the card Element
    const { token, error } = await stripe.createToken(cardElement);

    if (error) {
        console.error('Error creating token:', error);
    } else {
        const tokenID = token.id;
        console.log('Token ID:', tokenID);

        // Make a POST request to your server with the token
        fetch('http://localhost:3000/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                token: tokenID,
                priceId: 'price_1PE3CfSASGjb3zqkjpRKQVkc' // Your price ID
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Subscription created:', data);
        })
        .catch(error => {
            console.error('Error creating subscription:', error);
        });
    }
});
