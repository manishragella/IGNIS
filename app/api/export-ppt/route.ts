import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Proxying export-ppt request to Python backend...');

    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

    const response = await fetch(`${backendUrl}/api/export-ppt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Python PPT Export failed:', errData);
      return NextResponse.json(
        { error: errData.detail || 'Failed to export PowerPoint presentation' },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Successfully generated PowerPoint binary, streaming back...');
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="ignis_activity_presentation.pptx"`,
      },
    });
  } catch (error: any) {
    console.error('Error proxying export-ppt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export PowerPoint presentation' },
      { status: 500 }
    );
  }
}
