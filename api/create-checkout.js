const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Vercel serverless functions require the handler to be the default export.
// They use an Express-like (req, res) signature, rather than the Lambda (event) signature.
export default async function handler(req, res) {

  // Only allow POST requests (using Vercel's req/res objects)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- BEGIN Checkout Logic ---
  try {
    // Vercel usually parses the JSON body automatically into req.body for POST requests.
    // If the client side is sending JSON with the correct Content-Type header, req.body should be an object.
    const data = req.body;
    
    // Check if the body parsing was successful and data is available
    if (!data || !data.cart || !data.purchaser) {
        return res.status(400).json({ error: 'Invalid or missing cart data in request body.' });
    }
    
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
    
    // Calculate the correct origin dynamically for success/cancel URLs
    // We prioritize req.headers.origin for security, falling back to constructing the URL
    const origin = req.headers.origin || `https://${req.headers.host}`;


    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // Updated to use the dynamic origin variable
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
      customer_email: data.purchaser.email,
      metadata: {
        purchaserName: `${data.purchaser.firstName} ${data.purchaser.lastName}`,
        dancerFamily: data.purchaser.dancerFamily,
        phone: data.purchaser.phone,
        orderData: JSON.stringify(data)
      }
    });

    // Return the session URL using Vercel's standard response method
    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Stripe error:', error);
    // Return error using Vercel's standard response method
    return res.status(500).json({ error: error.message });
  }
}
