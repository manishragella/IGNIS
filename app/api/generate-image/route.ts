import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const togetherApiKey = process.env.TOGETHER_API_KEY;
    const styledPrompt = `${prompt}, educational textbook illustration, clean vector style, colorful, printable, kid-friendly, high detail, clean white background, infographic style`;

    if (togetherApiKey) {
      try {
        console.log('Generating image via Together AI...');
        const res = await fetch('https://api.together.xyz/v1/images/generations', {
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

        const data = await res.json();
        if (res.ok && data.data?.[0]?.b64_json) {
          const dataUrl = `data:image/png;base64,${data.data[0].b64_json}`;
          return NextResponse.json({ imageUrl: dataUrl });
        } else {
          console.error('Together AI API error:', data);
        }
      } catch (err) {
        console.error('Together AI generation failed, falling back to Pollinations AI:', err);
      }
    }

    // Fall back to Pollinations AI
    try {
      console.log('Together AI not configured or failed. Generating dynamic visual via keyless Pollinations AI...');
      const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(styledPrompt)}?width=1024&height=768&nologo=true`;
      const imgRes = await fetch(pollinationsUrl);
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return NextResponse.json({ imageUrl: `data:image/jpeg;base64,${base64}` });
      } else {
        throw new Error(`Pollinations AI failed with status: ${imgRes.status}`);
      }
    } catch (err: any) {
      console.error('Pollinations AI generation failed:', err);
      // Absolute fallback to premium static placeholder if all else fails
      return NextResponse.json({
        imageUrl: '/images/textbook-illustration-fallback.svg',
        fallback: true,
        message: 'Visual generation failed completely. Fallback loaded.'
      });
    }
  } catch (error: any) {
    console.error('Image generation endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}
