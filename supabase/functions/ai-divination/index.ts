import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    const apiKey = Deno.env.get('ZHIPU_API_KEY')

    if (!apiKey) {
      throw new Error('Missing ZHIPU_API_KEY environment variable')
    }

    console.log("Calling Zhipu AI with model glm-4-flash")

    // Call Zhipu AI API
    // Using glm-4-flash as it is faster and cheaper for simple tasks like divination
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash', 
        messages: messages,
        stream: false
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error("Zhipu API Error:", data.error)
      // Return 200 with error details so client can display it
      return new Response(JSON.stringify({ error: data.error.message || 'Error calling Zhipu AI' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Function Error:", error)
    // Return 200 with error details so client can display it
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
