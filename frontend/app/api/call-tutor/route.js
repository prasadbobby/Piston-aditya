// app/api/call-tutor/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phoneNumber, userName } = await request.json();
    
    // Use server-side environment variables (without NEXT_PUBLIC_ prefix)
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const TUTOR_AGENT_ID = process.env.TUTOR_AGENT_ID;
    const AGENT_PHONE_NUMBER_ID = process.env.AGENT_PHONE_NUMBER_ID;
    
    console.log('API Key available:', !!ELEVENLABS_API_KEY);
    console.log('Agent ID available:', !!TUTOR_AGENT_ID);
    console.log('Phone ID available:', !!AGENT_PHONE_NUMBER_ID);
    
    if (!ELEVENLABS_API_KEY || !TUTOR_AGENT_ID || !AGENT_PHONE_NUMBER_ID) {
      console.error('Missing environment variables:', {
        hasApiKey: !!ELEVENLABS_API_KEY,
        hasAgentId: !!TUTOR_AGENT_ID,
        hasPhoneId: !!AGENT_PHONE_NUMBER_ID
      });
      
      return NextResponse.json(
        { success: false, error: 'Server configuration missing. Please contact support.' },
        { status: 500 }
      );
    }
    
    console.log('Initiating call to:', phoneNumber);
    
    // Call ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: TUTOR_AGENT_ID,
        agent_phone_number_id: AGENT_PHONE_NUMBER_ID,
        to_number: phoneNumber,
        context: {
          user_name: userName,
          call_type: 'tutor_assistance',
          timestamp: new Date().toISOString()
        }
      }),
    });
    
    const result = await response.json();
    console.log('ElevenLabs response:', response.status, result);
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        call_id: result.call_id,
        message: 'Tutor call initiated successfully'
      });
    } else {
      console.error('ElevenLabs API error:', result);
      return NextResponse.json(
        { success: false, error: result.detail || result.error || 'Failed to initiate call' },
        { status: response.status }
      );
    }
    
  } catch (error) {
    console.error('Error initiating tutor call:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}