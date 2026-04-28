// supabase/functions/sepay-webhook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Promise<Response>): void;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req: Request) => {
    // 1. Verify Webhook Method
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 2. Auth Check - SePay uses Bearer Token in Authorization header
        const authHeader = req.headers.get('Authorization');
        const webhookSecret = Deno.env.get('SEPAY_WEBHOOK_SECRET');

        if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
            console.error('Invalid Webhook Secret');
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const payload = await req.json();
        console.log('SePay Webhook Received:', JSON.stringify(payload));

        // 3. IP Validation (Security - Optional but recommended for Production)
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim();
        const allowedIps = [
            '172.236.138.20', '172.233.83.68', '171.244.35.2',
            '151.158.108.68', '151.158.109.79', '103.255.238.139'
        ];

        if (clientIp && !allowedIps.includes(clientIp)) {
            console.warn(`Webhook received from untrusted IP: ${clientIp}`);
            // Note: In development/ngrok, we might skip this. For now, we log it.
        }

        const { content, transferAmount, transferType } = payload;

        // Only process incoming transfers
        if (transferType !== 'IN') {
            return new Response(JSON.stringify({ message: 'Ignored: Not an incoming transfer' }), { status: 200 });
        }

        // 3. Extract Order ID from content (Format: "SEPAY {ORDER_PREFIX}")
        const match = content.match(/SEPAY\s+([A-Z0-9]+)/i);
        if (!match) {
            console.log('No order ID found in content:', content);
            return new Response(JSON.stringify({ message: 'Ignored: No Order ID prefix found' }), { status: 200 });
        }

        const orderPrefix = match[1].toUpperCase();

        // 4. Initialize Supabase Admin
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 5. Find the order - Using ilike for prefix matching
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .ilike('id', `${orderPrefix}%`)
            .in('status', ['PENDING', 'AWAITING_CONFIRMATION'])
            .order('submitted_at', { ascending: false });

        if (orderError || !orders || orders.length === 0) {
            console.error('Order not found or already processed:', orderPrefix, orderError);
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        // Pick the best match (closest amount or most recent)
        const order = orders.find(o => Math.abs(o.amount - transferAmount) < 100) || orders[0];

        // 6. Update Order and Activate Business Membership
        // Note: We perform this in a sequence. For production, consider using a database function (RPC) for atomic updates.

        // Update Order Status
        const { error: updateOrderError } = await supabase
            .from('orders')
            .update({
                status: 'COMPLETED',
                payment_proof_url: `sepay-transaction-${payload.id}` // Link to SePay transaction ID
            })
            .eq('id', order.id);

        if (updateOrderError) {
            console.error('Failed to update order:', updateOrderError);
            throw updateOrderError;
        }

        // Get Package Info to set expiry date
        const { data: pkg, error: pkgError } = await supabase
            .from('membership_packages')
            .select('*')
            .eq('id', order.package_id)
            .single();

        if (pkgError) throw pkgError;

        // Calculate Expiry Date
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (pkg.duration_months || 1));

        // Update Business Membership
        const { error: updateBusinessError } = await supabase
            .from('businesses')
            .update({
                membership_tier: pkg.tier,
                membership_expiry_date: expiryDate.toISOString(),
                is_active: true
            })
            .eq('id', order.business_id);

        if (updateBusinessError) {
            console.error('Failed to update business membership:', updateBusinessError);
            throw updateBusinessError;
        }

        console.log(`Successfully activated membership for business ${order.business_id} (Order: ${order.id})`);

        return new Response(JSON.stringify({
            success: true,
            message: `Activated package ${pkg.name} for business ${order.business_id}`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
