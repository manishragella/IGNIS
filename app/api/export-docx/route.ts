import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Proxying export-docx request to Python backend...');

    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

    const response = await fetch(`${backendUrl}/api/export-docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Python DOCX Export failed:', errData);
      return NextResponse.json(
        { error: errData.detail || 'Failed to export Word document' },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Successfully generated Word binary, streaming back...');
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="ignis_activity_worksheet.docx"`,
      },
    });
  } catch (error: any) {
    console.error('Error proxying export-docx:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export Word document' },
      { status: 500 }
    );
  }
}
