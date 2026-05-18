import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EVALUATION_PROMPT } from '@/lib/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const submissionText = formData.get('text') as string | null;

    if (!imageFile && !submissionText) {
      return NextResponse.json(
        { error: 'Either image or text submission is required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;

    if (imageFile) {
      // Vision evaluation
      const imageBytes = await imageFile.arrayBuffer();
      const imagePart = {
        inlineData: {
          data: Buffer.from(imageBytes).toString('base64'),
          mimeType: imageFile.type,
        },
      };

      const prompt = EVALUATION_PROMPT();

      result = await model.generateContent([prompt, imagePart]);
    } else {
      // Text evaluation
      const prompt = EVALUATION_PROMPT(submissionText!);
      result = await model.generateContent(prompt);
    }

    const text = result.response.text();

    // Clean response
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ feedback: parsed });
  } catch (error: any) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate submission' },
      { status: 500 }
    );
  }
}
