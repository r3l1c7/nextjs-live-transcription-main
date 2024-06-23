///app/api/validate-answer.ts
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-3.5-turbo" if you prefer
      messages: [
        { role: "system", content: "You are a helpful assistant that validates answers to medical intake questions. Ensure the answer is appropriate and properly formatted for the given question. If you feel like you can modify the answer to be in the right format do so. You are taking TTS translations which will often require fixing and improving. <example> (question) What is your name: (answer) Mike Bawgin B-A-W-L-G-H-I-N </example>" },
        { role: "user", content: `Question: "${question}" Answer: "${answer}" Is this answer valid, appropriate, and properly formatted? If you can fix the issue, fix it, then respond with a JSON object containing 'answer', 'isValid' (boolean) and 'reason' (string explaining why it's valid or invalid).` }
      ],
    });

    const result = response.choices[0].message.content;
    return NextResponse.json({ result });

  } catch (error) {
    console.error('Error validating answer:', error);
    return NextResponse.json({ error: 'Error validating answer' }, { status: 500 });
  }
}