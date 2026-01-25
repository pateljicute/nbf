
import { NextResponse } from 'next/server';

const GEN_AI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function POST(req: Request) {
    try {
        if (!GEN_AI_API_KEY) {
            return NextResponse.json(
                { error: 'Server Warning: AI Configuration Missing (API Key)' },
                { status: 500 }
            );
        }

        const { propertyData } = await req.json();

        // Construct a prompt based on available data
        // "Write a compelling and believable description of this room in the language and accent of Mandsaur."
        const userPrompt = `Write a compelling and believable description of this property in the language and accent of Mandsaur (mix of Hindi/Malwi).
        
        Details:
        - Title: ${propertyData.title}
        - Type: ${propertyData.type}
        - Location: ${propertyData.city}, ${propertyData.locality}
        - Amenities: ${propertyData.amenities?.join(', ') || 'Standard amenities'}
        - Furnishing: ${propertyData.furnishingStatus}
        - Rent: ₹${propertyData.price}
        
        Keep it short, engaging, and localized. Avoid emojis overuse. Max 100 words.`;

        const payload = {
            contents: [{
                parts: [{ text: userPrompt }]
            }]
        };

        const response = await fetch(`${API_URL}?key=${GEN_AI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'AI Request Failed');
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('No text generated');
        }

        return NextResponse.json({ description: generatedText });

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
