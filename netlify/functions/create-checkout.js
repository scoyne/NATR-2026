const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Set default success/cancel URLs, using the origin header for portability
  const origin = event.headers.origin || 'http://localhost:8888';
  const success_url = `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/cancel.html`;

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    
    // Log the incoming data for debugging purposes (remove this in production if sensitive data is involved)
    console.log('Received purchase data:', JSON.stringify(data, null, 2));

    // Build line items for Stripe
    const lineItems = [];

    // --- ITEM PROCESSING START ---

    // Event Tickets
    // Ensure quantity exists and is greater than 0 before adding
    if (data.cart.eventTickets && data.cart.eventTickets.quantity > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Event Tickets',
            description: `${data.cart.eventTickets.quantity} tickets for Night at the Races`
          },
          unit_amount: 2500, // $25.00 in cents
        },
        quantity: data.cart.eventTickets.quantity
      });
    }

    // Horses
    if (data.cart.horses && data.cart.horses.quantity > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Horse Sponsorships',
            description: `${data.cart.horses.quantity} horse sponsorships`
          },
          unit_amount: 2500, // $25.00 in cents
        },
        quantity: data.cart.horses.quantity
      });
    }

    // Program Ads
    if (data.cart.programAds && data.cart.programAds.length > 0) {
      data.cart.programAds.forEach(ad => {
        // Double-check ad price is valid
        if (ad.price && ad.price > 0) { 
          const sizeLabel = 
            ad.price === 25 ? 'Business Card' :
            ad.price === 50 ? '½ Page' :
            ad.price === 100 ? 'Full Page' :
            ad.price === 120 ? 'Full Page + Sponsored Race' : 'Program Ad';
          
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Program Book Ad - ${sizeLabel}`,
                description: `Program Ad #${ad.adNumber}`
              },
              unit_amount: ad.price * 100 // Convert to cents
            },
            quantity: 1
          });
        }
      });
    }

    // Raffle Tickets
    if (data.cart.raffleTickets) {
      const price = data.cart.raffleTickets.type === 'individual' ? 5 : 20;
      const qty = data.cart.raffleTickets.type === 'individual' 
        ? data.cart.raffleTickets.quantity 
        : data.cart.raffleTickets.bookQuantity;
      
      // Ensure quantity is positive
      if (qty > 0) { 
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Raffle Tickets',
              description: data.cart.raffleTickets.type === 'individual'
                ? `${qty} individual tickets`
                : `${qty} books (${qty * 5} tickets)`
            },
            unit_amount: price * 100
          },
          quantity: qty
        });
      }
    }

    // Cash Donation
    if (data.cart.donation && data.cart.donation.type === 'cash' && data.cart.donation.amount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Cash Donation',
            description: 'Tax-deductible donation to Brady Campbell Irish Dance School'
          },
          unit_amount: Math.round(data.cart.donation.amount * 100)
        },
        quantity: 1
      });
    }

    // Add processing fee if customer is covering it
    if (data.totals.coveringFees && data.totals.processingFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Processing Fee',
            description: 'Credit card processing fee (2.9% + $0.30)'
          },
          unit_amount: Math.round(data.totals.processingFee * 100)
        },
        quantity: 1
      });
    }
    
    // --- ITEM PROCESSING END ---

    // CRITICAL FIX: Check if there are any line items before creating the Stripe session
    if (lineItems.length === 0) {
      console.log('Error: Checkout attempted with no valid line items.');
      return {
        statusCode: 400, // Use 400 for a bad request from the client
        body: JSON.stringify({ error: 'Cart is empty or no items have a positive price/quantity.' })
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: data.purchaser.email,
      metadata: {
        purchaserName: `${data.purchaser.firstName} ${data.purchaser.lastName}`,
        dancerFamily: data.purchaser.dancerFamily,
        phone: data.purchaser.phone,
        orderData: JSON.stringify(data)
      }
    });

    // Return the session URL
    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {
    console.error('Stripe handler error:', error);
    // Return a generic 500 status but include the specific error message for debugging
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'An unknown server error occurred.' })
    };
  }
};
