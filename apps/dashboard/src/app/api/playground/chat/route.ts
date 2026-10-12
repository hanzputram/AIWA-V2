import { NextResponse } from 'next/server';
import { generateAiReply, CATALOG } from '@/lib/ai-sales';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], negotiationRound = 1 } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Pesan wajib diisi' }, { status: 400 });
    }

    const result = await generateAiReply(message, history, negotiationRound);

    return NextResponse.json({
      success: true,
      replyText: result.replyText,
      activeIntent: result.activeIntent,
      activeSkills: result.activeSkills,
      negotiationRound: negotiationRound + (result.activeIntent === 'pricing_negotiation' ? 1 : 0),
      guardrail: {
        status: 'Aktif 100%',
        catalogPrice: 1350000,
        tierDiscount: '5% (Rp 1.282.500)',
        floorPrice: 1188000,
        maxOffer: result.guardrailOffer || 1250000,
        isFloorSafe: (result.guardrailOffer || 1250000) >= 1188000,
      },
      recommendations: result.recommendations,
      attachment: result.attachment,
      aiProvider: result.aiProvider,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.error('[PLAYGROUND API] Server error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
