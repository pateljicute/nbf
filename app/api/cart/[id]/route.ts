import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        id: "cart_mock",
        lines: [],
        cost: { subtotalAmount: { amount: "0", currencyCode: "INR" }, totalAmount: { amount: "0", currencyCode: "INR" } },
        totalQuantity: 0
    });
}
