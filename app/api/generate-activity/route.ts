import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ACTIVITY_GENERATION_PROMPT } from '@/lib/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { grade, topic, languageFocus, lifeSkillFocus } = await request.json();

    if (!grade || !topic || !languageFocus || !lifeSkillFocus) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = ACTIVITY_GENERATION_PROMPT(grade, topic, languageFocus, lifeSkillFocus);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean the response - remove markdown code blocks if present
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Auto-generate illustration
    if (parsed.imagePrompt) {
      const styledPrompt = `${parsed.imagePrompt}, educational textbook illustration, clean vector style, colorful, printable, kid-friendly, high detail, clean white background, infographic style`;
      const togetherApiKey = process.env.TOGETHER_API_KEY;
      let generatedImageBase64 = '';

      if (togetherApiKey) {
        try {
          console.log('Generating activity illustration via Together AI...');
          const imgRes = await fetch('https://api.together.xyz/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${togetherApiKey}`,
            },
            body: JSON.stringify({
              model: 'black-forest-labs/FLUX.1-schnell',
              prompt: styledPrompt,
              width: 1024,
              height: 768,
              steps: 4,
              n: 1,
              response_format: 'b64_json',
            }),
          });

          const imgData = await imgRes.json();
          if (imgRes.ok && imgData.data?.[0]?.b64_json) {
            generatedImageBase64 = `data:image/png;base64,${imgData.data[0].b64_json}`;
            console.log('Successfully generated illustration via Together AI.');
          } else {
            console.error('Together AI image generation failed:', imgData);
          }
        } catch (err) {
          console.error('Failed to generate Together AI image in activity route:', err);
        }
      }

      // If Together AI was not configured or failed, use keyless dynamic Pollinations AI fallback
      if (!generatedImageBase64) {
        try {
          console.log('Together AI not configured or failed. Generating dynamic illustration via keyless Pollinations AI...');
          const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(styledPrompt)}?width=1024&height=768&nologo=true`;
          const imgRes = await fetch(pollinationsUrl);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            generatedImageBase64 = `data:image/jpeg;base64,${base64}`;
            console.log('Successfully generated dynamic fallback illustration via Pollinations AI.');
          } else {
            console.error('Pollinations AI failed with status:', imgRes.status);
          }
        } catch (err) {
          console.error('Failed to generate Pollinations AI image:', err);
        }
      }

      parsed.imageUrl = generatedImageBase64 || '/images/textbook-illustration-fallback.svg';
    } else {
      parsed.imageUrl = '/images/textbook-illustration-fallback.svg';
    }

    return NextResponse.json({ activity: parsed });
  } catch (error: any) {
    console.error('Activity generation error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate activity' },
      { status: 500 }
    );
  }
}
