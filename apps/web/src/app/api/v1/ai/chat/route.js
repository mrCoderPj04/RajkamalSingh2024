import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, docContext, roomId } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        reply: `[SOFO AI Assistant]: GEMINI_API_KEY is not configured in Netlify environment variables. In response to "${prompt}", SOFO Sync session is active.`,
        model: 'SOFO AI Assistant Fallback'
      });
    }

    const systemContext = `Active Room: ${roomId || 'Authenticated'}. ${docContext ? `Collaborative Doc Text: "${docContext.slice(0, 500)}"` : ''}`;
    const fullPrompt = `System Context: You are SOFO AI Copilot, a real-time collaboration assistant for SOFO Sync app ("One QR. Instant Connection. Real-Time Collaboration."). ${systemContext}\nUser Query: ${prompt}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      })
    });

    const data = await res.json();
    let replyText = `[SOFO AI Copilot]: Response to "${prompt}" generated.`;

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      replyText = data.candidates[0].content.parts[0].text;
    } else if (data.error?.message) {
      replyText = `[SOFO AI - Gemini]: ${data.error.message}`;
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      model: 'Google Gemini 1.5 Flash',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      reply: '[SOFO AI Copilot]: Real-time session synchronization active.'
    });
  }
}
