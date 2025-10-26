// api/create-checkout.js
// Creates Stripe session - NO database save (webhook handles that)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    if (!data || !data.cart || !data.purchaser) {
      return res.status(400).json({ error: 'Invalid cart data' });
    }

    console.log('📦 Creating checkout for:', data.purchaser.email);
    
    const lineItems = [];

    // Event Tickets
    const eventTicketQty = data.cart.eventTickets ? parseInt(data.cart.eventTickets.quantity, 10) : 0;
    if (eventTicketQty > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Event Tickets',
            description: `${eventTicketQty} tickets for Night at the Races`
          },
          unit_amount: 2500,
        },
        quantity: eventTicketQty
      });
    }

    // Horses
    const horseQty = data.cart.horses ? parseInt(data.cart.horses.quantity, 10) : 0;
    if (horseQty > 0) { 
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Horse Sponsorships',
            description: `${horseQty} horse sponsorships`
          },
          unit_amount: 2500,
        },
        quantity: horseQty
      });
    }

    // Program Ads
    if (data.cart.programAds && data.cart.programAds.length > 0) {
      data.cart.programAds.forEach(ad => {
        if (ad.price > 0) {
          const sizeLabel = ad.sizeLabel || 
            (ad.price === 25 ? 'Business Card' :
             ad.price === 50 ? '½ Page' :
             ad.price === 100 ? 'Full Page' :
             ad.price === 120 ? 'Full Page + Sponsored Race' : 'Program Ad');
          
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Program Book Ad - ${sizeLabel}`,
                description: `Business: ${ad.businessName || 'Program Ad'}`
              },
              unit_amount: ad.price * 100
            },
            quantity: 1
          });
        }
      });
    }

    // Raffle Tickets
    if (data.cart.raffleTickets) {
      const price = data.cart.raffleTickets.type === 'individual' ? 5 : 20;
      
      let raffleQtyRaw;
      if (data.cart.raffleTickets.type === 'individual') {
        raffleQtyRaw = data.cart.raffleTickets.individualTickets || data.cart.raffleTickets.quantity;
      } else {
        raffleQtyRaw = data.cart.raffleTickets.books || data.cart.raffleTickets.bookQuantity;
      }
      
      const finalRaffleQty = parseInt(raffleQtyRaw, 10) || 0;
      
      if (finalRaffleQty > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Raffle Tickets',
              description: data.cart.raffleTickets.type === 'individual'
                ? `${finalRaffleQty} individual tickets`
                : `${finalRaffleQty} books (${finalRaffleQty * 5} tickets)`
            },
            unit_amount: price * 100
          },
          quantity: finalRaffleQty
        });
      }
    }

    // Cash Donation
    if (data.cart.cashDonation && data.cart.cashDonation.amount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Cash Donation',
            description: 'Tax-deductible donation'
          },
          unit_amount: Math.round(data.cart.cashDonation.amount * 100)
        },
        quantity: 1
      });
    }
    
    if (data.cart.donation && data.cart.donation.type === 'cash' && data.cart.donation.amount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Cash Donation',
            description: 'Tax-deductible donation'
          },
          unit_amount: Math.round(data.cart.donation.amount * 100)
        },
        quantity: 1
      });
    }

    // Processing Fee
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

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    // Prepare metadata (within 500 char limit per field)
    const metadata = {
      purchaserName: `${data.purchaser.firstName} ${data.purchaser.lastName}`,
      dancerFamily: data.purchaser.dancerFamily,
      phone: data.purchaser.phone
    };

    // Add detailed cart data to metadata (truncate if needed)
    if (data.cart.eventTickets?.tableName) {
      metadata.tableName = data.cart.eventTickets.tableName.substring(0, 400);
    }

    if (data.cart.horses?.entries && data.cart.horses.entries.length > 0) {
      const horsesData = data.cart.horses.entries.map(h => ({ name: h.name, owner: h.owner }));
      metadata.horses = JSON.stringify(horsesData).substring(0, 450);
    }

    if (data.cart.programAds && data.cart.programAds.length > 0) {
      const adsData = data.cart.programAds.map(ad => ({
        business: ad.businessName,
        size: ad.sizeLabel,
        design: ad.designOption
      }));
      metadata.programAds = JSON.stringify(adsData).substring(0, 450);
    }

    if (data.cart.raffleTickets?.entries && data.cart.raffleTickets.entries.length > 0) {
      const raffleData = data.cart.raffleTickets.entries.map(e => ({
        name: e.name,
        contact: e.contact,
        tickets: e.tickets
      }));
      metadata.raffleOwners = JSON.stringify(raffleData).substring(0, 450);
    }

    console.log('💳 Creating Stripe session');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
      customer_email: data.purchaser.email,
      metadata: metadata
    });

    console.log('✅ Session created:', session.id);
    console.log('⏳ Order will be saved via webhook after payment');

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(500).json({ 
        error: `Stripe error: ${error.message}`,
        param: error.param
      });
    }
    
    return res.status(500).json({ error: error.message });
  }
}