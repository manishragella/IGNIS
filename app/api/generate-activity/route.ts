import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    console.log('Proxying generate-activity request to Python backend...');
    
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    
    // Call the Python backend microservice
    const response = await fetch(`${backendUrl}/api/generate-activity`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Python backend returned error:', data);
      return NextResponse.json(
        { error: data.detail || 'Python backend activity generation failed' },
        { status: response.status }
      );
    }

    console.log('Successfully received activity from Python backend!');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying generate-activity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to communicate with the activity generator service' },
      { status: 500 }
    );
  }
}
