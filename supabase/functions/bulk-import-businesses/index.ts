
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { businesses } = await req.json()

        if (!businesses || !Array.isArray(businesses)) {
            throw new Error('Invalid body: "businesses" array is required')
        }

        const results = {
            success: [] as any[],
            failed: [] as any[]
        }

        console.log(`Processing import for ${businesses.length} businesses...`)

        for (const b of businesses) {
            const {
                email,
                password,
                name,
                address,
                phone,
                city,
                district,
                ward,
                latitude,
                longitude,
                category,
                description,
                images_str, // Comma separated images
                working_hours_start,
                working_hours_end,
                website
            } = b

            try {
                if (!email || !password || !name) {
                    throw new Error('Missing required fields: email, password, or name')
                }

                // 1. Check if user exists or create new user
                let userId: string | null = null

                // Search for existing user
                const { data: { users }, error: searchError } = await supabaseClient.auth.admin.listUsers()
                const existingUser = users.find(u => u.email === email)

                if (existingUser) {
                    userId = existingUser.id
                    console.log(`User ${email} already exists: ${userId}`)
                } else {
                    // Create new user
                    const { data: userData, error: createError } = await supabaseClient.auth.admin.createUser({
                        email,
                        password,
                        email_confirm: true,
                        user_metadata: { full_name: name, role: 'business_owner' }
                    })
                    if (createError) throw createError
                    userId = userData.user.id
                    console.log(`Created user ${email}: ${userId}`)
                }

                // 2. Prepare Business Data
                const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`

                // Gallery logic
                const gallery = images_str
                    ? images_str.split(',').map((url: string) => url.trim()).filter((url: string) => url.length > 0)
                    : []

                // Cover image (first of gallery or placeholder)
                const imageUrl = gallery.length > 0
                    ? gallery[0]
                    : `https://via.placeholder.com/800x600?text=${encodeURIComponent(name)}`

                // Valid categories
                const categories = [category || 'Spa & Massage']

                // Working hours
                const workingHours = {
                    "Thứ 2 - Thứ 6": `${working_hours_start || '09:00'} - ${working_hours_end || '20:00'}`,
                    "Thứ 7 - Chủ Nhật": "09:00 - 21:00"
                }

                const businessData = {
                    owner_id: userId,
                    name,
                    slug,
                    email,
                    phone,
                    address,
                    city: city || 'Hồ Chí Minh',
                    district: district || '',
                    ward: ward || '',
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                    description: description || '',
                    category: categories[0], // Legacy field
                    categories: categories,
                    image_url: imageUrl,
                    gallery: gallery,
                    working_hours: workingHours,
                    website,
                    is_active: true,
                    is_verified: true,
                    membership_tier: 'Free',
                    joined_date: new Date().toISOString()
                }

                // 3. Insert Business
                const { error: insertError } = await supabaseClient
                    .from('businesses')
                    .insert(businessData)

                if (insertError) throw insertError

                results.success.push({ name, email })

            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Unknown error'
                console.error(`Error importing ${b.name}:`, msg)
                results.failed.push({ name: b.name, email: b.email, error: msg })
            }
        }

        return new Response(
            JSON.stringify(results),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
