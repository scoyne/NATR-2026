module.exports = async function handler(req, res) {
  console.log('🔔 WEBHOOK CALLED!', req.method);
  console.log('Headers:', req.headers);
  
  // ... rest of your code

// api/stripe-webhook.js
// Receives payment confirmation from Stripe and saves to database

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Generate unique 6-digit raffle numbers
function generateRaffleTicketNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
async function generateUniqueRaffleNumbers(count) {
  const numbers = [];
  const attempts = count * 10;
  let attemptsUsed = 0;
  while (numbers.length < count && attemptsUsed < attempts) {
    const num = generateRaffleTicketNumber();
    const { data } = await supabase
      .from('raffle_tickets')
      .select('ticket_number')
      .eq('ticket_number', num)
      .limit(1);
    if (!data || data.length === 0) {
      if (!numbers.includes(num)) numbers.push(num);
    }
    attemptsUsed++;
  }
  if (numbers.length < count) {
    throw new Error('Could not generate enough unique raffle numbers');
  }
  return numbers;
}

// Parse raw body
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log('✅ Webhook verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Payment completed! Session:', session.id);
    try {
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items', 'payment_intent'] });

      // Calculate Stripe fee (if present)
      let stripeFeeActual = 0;
      if (fullSession.payment_intent && fullSession.payment_intent.charges?.data?.[0]) {
        const charge = fullSession.payment_intent.charges.data[0];
        if (charge.balance_transaction) {
          const balanceTx = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
          stripeFeeActual = (balanceTx.fee || 0) / 100;
        }
      }

      const metadata = fullSession.metadata || {};
      const purchaserName = metadata.purchaserName || '';
      const [firstName, ...lastNameParts] = purchaserName.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      const email = fullSession.customer_details?.email || '';
      const phone = metadata.phone || '';
      const dancerFamily = metadata.dancerFamily || '';

      const totalPaid = (fullSession.amount_total || 0) / 100;
      const subtotal = (fullSession.amount_subtotal || 0) / 100;
      const processingFeePaid = totalPaid - subtotal;

      console.log('Saving order to database...');

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          stripe_payment_intent_id: fullSession.payment_intent?.id || null,
          purchaser_first_name: firstName,
          purchaser_last_name: lastName,
          purchaser_email: email,
          purchaser_phone: phone,
          dancer_family: dancerFamily,
          subtotal: subtotal,
          processing_fee: processingFeePaid,
          total_paid: totalPaid,
          covered_fees: processingFeePaid > 0,
          payment_status: 'completed',
          stripe_fee_actual: stripeFeeActual
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw orderError;
      }
      const orderId = orderData.order_id;
      console.log('✅ Order created:', orderId);

      // Parse metadata details
      let tableName = null;
      let horses = [];
      let programAds = [];
      let raffleOwners = [];
      try {
        if (metadata.tableName) tableName = metadata.tableName;
        if (metadata.horses) horses = JSON.parse(metadata.horses);
        if (metadata.programAds) programAds = JSON.parse(metadata.programAds);
        if (metadata.raffleOwners) raffleOwners = JSON.parse(metadata.raffleOwners);
      } catch (parseError) {
        console.warn('⚠️ Metadata parse warning:', parseError.message);
      }

      // Process line items
      const lineItems = fullSession.line_items?.data || [];
      for (const item of lineItems) {
        const description = item.description || item.price?.product?.name || '';
        const quantity = item.quantity || 1;
        const amount = (item.amount_total || item.price?.unit_amount || 0) / 100;
        console.log(`Processing: ${description}`);

        // Event Tickets
        if (description.includes('tickets for Night at the Races')) {
          await supabase.from('event_tickets').insert({
            order_id: orderId,
            quantity: quantity,
            table_name: tableName,
            price_per_ticket: 25,
            total_price: amount
          });
          console.log('✅ Event tickets saved');

          // Update inventory - read/then write to avoid supabase.raw usage
          const { data: inv, error: invErr } = await supabase.from('inventory').select('total_sold').eq('item_type', 'event_tickets').limit(1).single();
          if (!invErr && inv) {
            const newTotal = (inv.total_sold || 0) + quantity;
            await supabase.from('inventory').update({ total_sold: newTotal, last_updated: new Date().toISOString() }).eq('item_type', 'event_tickets');
          }
        }

        // Horses
        if (description.toLowerCase().includes('horse sponsorships')) {
          if (horses.length > 0) {
            const horseInserts = horses.slice(0, quantity).map((horse) => ({
              order_id: orderId,
              horse_name: horse.name || 'Horse',
              owner_name: horse.owner || purchaserName,
              price: 25
            }));
            await supabase.from('horses').insert(horseInserts);
            console.log('✅ Horses saved:', horseInserts.length);
          } else {
            for (let i = 0; i < quantity; i++) {
              await supabase.from('horses').insert({ order_id: orderId, horse_name: `Horse ${i + 1}`, owner_name: purchaserName, price: 25 });
            }
            console.log('✅ Horses saved (fallback)');
          }
          // inventory update same pattern as above
        }

        // Program Ads
        if (description.includes('Program Book Ad')) {
          const adSize = description.split(' - ')[1] || 'Unknown';
          const businessName = description.split('Business: ')[1] || 'Business';
          await supabase.from('program_ads').insert({ order_id: orderId, business_name: businessName, ad_size: adSize, price: amount, design_option: 'unknown', instructions: null });
          console.log('✅ Program ad saved');
        }

        // Raffle Tickets
        if (description.includes('Raffle Tickets')) {
          const isBook = description.includes('books');
          const totalTickets = isBook ? quantity * 5 : quantity;
          console.log(`Generating ${totalTickets} raffle numbers...`);
          const raffleNumbers = await generateUniqueRaffleNumbers(totalTickets);

          if (raffleOwners.length > 0) {
            let ticketIndex = 0;
            for (const owner of raffleOwners) {
              const ticketsForOwner = owner.tickets || 1;
              const bookId = ticketsForOwner === 5 ? crypto.randomUUID() : null;
              for (let i = 0; i < ticketsForOwner && ticketIndex < raffleNumbers.length; i++) {
                await supabase.from('raffle_tickets').insert({
                  order_id: orderId,
                  ticket_number: raffleNumbers[ticketIndex++],
                  owner_name: owner.name || purchaserName,
                  owner_contact: owner.contact || email,
                  ticket_type: isBook ? 'book' : 'individual',
                  book_id: bookId
                });
              }
            }
          } else {
            const raffleInserts = raffleNumbers.map((num, idx) => ({
              order_id: orderId,
              ticket_number: num,
              owner_name: purchaserName,
              owner_contact: email,
              ticket_type: isBook ? 'book' : 'individual',
              book_id: isBook ? Math.floor(idx / 5) : null
            }));
            await supabase.from('raffle_tickets').insert(raffleInserts);
          }
          console.log('✅ Raffle tickets saved');
        }

        // Donations
        if (description.includes('Cash Donation')) {
          await supabase.from('donations').insert({ order_id: orderId, donation_type: 'cash', amount: amount, purpose: 'General Fund', recognition_name: null });
          console.log('✅ Donation saved');
        }
      }

      console.log('Order complete! Stripe fee difference:', (stripeFeeActual - processingFeePaid).toFixed(2));
      return res.status(200).json({ received: true, orderId });
    } catch (error) {
      console.error('❌ Processing error:', error);
      return res.status(500).json({ error: error.message || String(error) });
    }
  }

  return res.status(200).json({ received: true });
};
