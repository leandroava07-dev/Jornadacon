exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages, systemPrompt } = JSON.parse(event.body);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ reply: 'ERRO: Chave não encontrada' }) };
    }

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { statusCode: 200, body: JSON.stringify({ reply: 'ERRO API: ' + JSON.stringify(data) }) };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: 'ERRO: ' + err.message })
    };
  }
};
