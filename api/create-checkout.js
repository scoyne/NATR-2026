const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);
    
    // Build line items for Stripe
    const lineItems = [];

    // Event Tickets
    if (data.cart.eventTickets) {
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
    if (data.cart.horses) {
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
        if (ad.price > 0) {
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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${event.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin}/cancel.html`,
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
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
