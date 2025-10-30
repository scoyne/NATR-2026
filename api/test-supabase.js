const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  console.log('Testing Supabase connection...');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // Try to insert a test order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: 'test_' + Date.now(),
        purchaser_first_name: 'Test',
        purchaser_last_name: 'User',
        purchaser_email: 'test@example.com',
        purchaser_phone: '555-1234',
        dancer_family: 'Test Family',
        order_date: new Date().toISOString(),
        subtotal: 25,
        processing_fee: 0,
        total_paid: 25,
        covered_fees: false,
        payment_status: 'test',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error 
      });
    }

    console.log('Success! Order created:', data);
    return res.status(200).json({ 
      success: true, 
      message: 'Supabase connection works!',
      orderId: data.order_id 
    });

  } catch (err) {
    console.error('Exception:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}
