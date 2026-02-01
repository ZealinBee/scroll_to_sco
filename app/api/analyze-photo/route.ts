import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/v1/analyze-photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Photo analysis proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to analysis service. Make sure the backend is running.',
        error_code: 'BACKEND_UNAVAILABLE'
      },
      { status: 503 }
    );
  }
}
