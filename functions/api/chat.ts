// functions/api/chat.ts
export const onRequestPost = async (context) => {
  try {
    const { history, message } = await context.request.json();
    
    // Lấy API Key từ Cloudflare Environment Variables
    const API_KEY = context.env.API_KEY; 

    // Gọi trực tiếp đến API của Google (không cần cài thư viện nặng nề)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: "Context của trường Hòn Gai..." }] },
          ...history,
          { role: 'user', parts: [{ text: message }] }
        ]
      })
    });

    const data = await response.json();
    const botResponse = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ text: botResponse }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Lỗi hệ thống" }), { status: 500 });
  }
}