exports.main = async (event, context) => {
  // Extract messages from event
  // When using callFunction({ name, data: payload }), the payload is merged into event.
  const { messages } = event;

  // Get API Key from environment variables
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    console.error('Missing ZHIPU_API_KEY environment variable');
    return { error: 'Missing ZHIPU_API_KEY environment variable' };
  }

  console.log("Calling Zhipu AI with model glm-4-flash");

  try {
    // Node.js 18+ has native fetch
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: messages,
        stream: false
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Zhipu API Error:", data.error);
      return { error: data.error.message || 'Error calling Zhipu AI' };
    }

    return data;
  } catch (error) {
    console.error("Function Error:", error);
    return { error: error.message };
  }
};
