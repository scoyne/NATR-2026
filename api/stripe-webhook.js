// api/stripe-webhook.js
// CRITICAL: Disable body parser for Stripe webhook verification

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// REQUIRED: Tell Vercel to give us raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

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

// Parse raw body for webhook verification
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// MAIN HANDLER
export default async function handler(req, res) {
  console.log('🔔 Webhook called:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let buf;
  try {
    buf = await buffer(req);
    console.log('📦 Received body, size:', buf.length);
  } catch (err) {
    console.error('❌ Failed to read body:', err);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.error('❌ No stripe-signature header');
    return res.status(400).json({ error: 'No stripe signature' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    console.log('✅ Webhook verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('💳 Payment completed! Session:', session.id);
    
    try {
      // Get full session with line items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'payment_intent']
      });

      // Calculate actual Stripe fee
      let stripeFeeActual = 0;
      if (fullSession.payment_intent && fullSession.payment_intent.charges?.data?.[0]) {
        const charge = fullSession.payment_intent.charges.data[0];
        if (charge.balance_transaction) {
          try {
            const balanceTx = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
            stripeFeeActual = (balanceTx.fee || 0) / 100;
          } catch (feeErr) {
            console.warn('⚠️ Could not get balance transaction:', feeErr.message);
          }
        }
      }

      // Extract purchaser info
      const metadata = fullSession.metadata || {};
      const purchaserName = metadata.purchaserName || '';
      const [firstName, ...lastNameParts] = purchaserName.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      const email = fullSession.customer_details?.email || fullSession.customer_email || '';
      const phone = metadata.phone || '';
      const dancerFamily = metadata.dancerFamily || '';

      // Calculate totals
      const totalPaid = (fullSession.amount_total || 0) / 100;
      const subtotal = (fullSession.amount_subtotal || 0) / 100;
      const processingFeePaid = totalPaid - subtotal;

      console.log('💾 Creating order in database...');
      console.log('Customer:', email, '| Total:', totalPaid);

      // INSERT ORDER
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          stripe_payment_intent_id: fullSession.payment_intent?.id || null,
          purchaser_first_name: firstName || 'Unknown',
          purchaser_last_name: lastName || 'Customer',
          purchaser_email: email,
          purchaser_phone: phone,
          dancer_family: dancerFamily,
          order_date: new Date().toISOString(),
          subtotal: subtotal,
          processing_fee: processingFeePaid,
          total_paid: totalPaid,
          covered_fees: processingFeePaid > 0,
          payment_status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation failed:', orderError);
        console.error('Error details:', JSON.stringify(orderError, null, 2));
        throw orderError;
      }
      
      const orderId = orderData.order_id;
      console.log('✅ Order created:', orderId);

      // Parse metadata
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
      console.log(`📦 Processing ${lineItems.length} line items...`);
      
      for (const item of lineItems) {
        const description = item.description || '';
        const quantity = item.quantity || 1;
        const amount = (item.amount_total || 0) / 100;
        
        console.log(`  → ${description} (qty: ${quantity})`);

        // EVENT TICKETS
        if (description.includes('tickets for Night at the Races')) {
          const { error: ticketError } = await supabase
            .from('event_tickets')
            .insert({
              order_id: orderId,
              quantity: quantity,
              table_name: tableName,
              price_per_ticket: 25,
              total_price: amount,
              created_at: new Date().toISOString()
            });
          
          if (ticketError) {
            console.error('    ❌ Event tickets error:', ticketError);
          } else {
            console.log('    ✅ Event tickets saved');
          }
        }

        // HORSES
        else if (description.toLowerCase().includes('horse sponsorships')) {
          const horseInserts = [];
          
          if (horses.length > 0) {
            for (let i = 0; i < quantity && i < horses.length; i++) {
              horseInserts.push({
                order_id: orderId,
                horse_name: horses[i].name || `Horse ${i + 1}`,
                owner_name: horses[i].owner || purchaserName,
                price: 25,
                created_at: new Date().toISOString()
              });
            }
          } else {
            for (let i = 0; i < quantity; i++) {
              horseInserts.push({
                order_id: orderId,
                horse_name: `Horse ${i + 1}`,
                owner_name: purchaserName || 'Owner',
                price: 25,
                created_at: new Date().toISOString()
              });
            }
          }
          
          const { error: horseError } = await supabase
            .from('horses')
            .insert(horseInserts);
          
          if (horseError) {
            console.error('    ❌ Horses error:', horseError);
          } else {
            console.log(`    ✅ ${horseInserts.length} horses saved`);
          }
        }

        // PROGRAM ADS
        else if (description.includes('Program Book Ad')) {
          const adSize = description.split(' - ')[1]?.split('\n')[0] || 'Unknown';
          const businessMatch = description.match(/Business: (.+)/);
          const businessName = businessMatch ? businessMatch[1] : 'Business';
          
          const { error: adError } = await supabase
            .from('program_ads')
            .insert({
              order_id: orderId,
              business_name: businessName,
              ad_size: adSize,
              price: amount,
              design_option: 'unknown',
              created_at: new Date().toISOString()
            });
          
          if (adError) {
            console.error('    ❌ Program ad error:', adError);
          } else {
            console.log('    ✅ Program ad saved');
          }
        }

        // RAFFLE TICKETS
        else if (description.includes('Raffle Tickets')) {
          const isBook = description.includes('books');
          const totalTickets = isBook ? quantity * 5 : quantity;
          
          console.log(`    🎫 Generating ${totalTickets} raffle numbers...`);
          const raffleNumbers = await generateUniqueRaffleNumbers(totalTickets);
          const raffleInserts = [];

          if (raffleOwners.length > 0) {
            let ticketIndex = 0;
            for (const owner of raffleOwners) {
              const ticketsForOwner = owner.tickets || 1;
              const bookId = ticketsForOwner === 5 ? crypto.randomUUID() : null;
              
              for (let i = 0; i < ticketsForOwner && ticketIndex < raffleNumbers.length; i++) {
                raffleInserts.push({
                  order_id: orderId,
                  ticket_number: raffleNumbers[ticketIndex++],
                  owner_name: owner.name || purchaserName || 'Owner',
                  owner_contact: owner.contact || email,
                  ticket_type: isBook ? 'book' : 'individual',
                  book_id: bookId,
                  created_at: new Date().toISOString()
                });
              }
            }
          } else {
            for (let i = 0; i < raffleNumbers.length; i++) {
              const bookId = isBook ? Math.floor(i / 5).toString() : null;
              raffleInserts.push({
                order_id: orderId,
                ticket_number: raffleNumbers[i],
                owner_name: purchaserName || 'Owner',
                owner_contact: email,
                ticket_type: isBook ? 'book' : 'individual',
                book_id: bookId,
                created_at: new Date().toISOString()
              });
            }
          }
          
          const { error: raffleError } = await supabase
            .from('raffle_tickets')
            .insert(raffleInserts);
          
          if (raffleError) {
            console.error('    ❌ Raffle tickets error:', raffleError);
          } else {
            console.log(`    ✅ ${raffleInserts.length} raffle tickets saved`);
          }
        }

        // DONATIONS
        else if (description.includes('Cash Donation')) {
          const { error: donationError } = await supabase
            .from('donations')
            .insert({
              order_id: orderId,
              donation_type: 'cash',
              amount: amount,
              purpose: 'General Fund',
              created_at: new Date().toISOString()
            });
          
          if (donationError) {
            console.error('    ❌ Donation error:', donationError);
          } else {
            console.log('    ✅ Donation saved');
          }
        }

        // PROCESSING FEE (skip - already included in totals)
        else if (description.includes('Processing Fee')) {
          console.log('    ℹ️ Processing fee (already tracked)');
        }
      }

      console.log('🎉 Order processing complete!');
      
      return res.status(200).json({ 
        received: true, 
        orderId: orderId 
      });
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
      return res.status(500).json({ 
        error: error.message || String(error) 
      });
    }
  }

  // For other event types
  console.log('ℹ️ Received event type:', event.type);
  return res.status(200).json({ received: true });
}