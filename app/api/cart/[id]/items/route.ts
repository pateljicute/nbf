import { NextResponse } from 'next/server';

const mockCart = {
    id: "cart_mock",
    lines: [],
    cost: { subtotalAmount: { amount: "0", currencyCode: "INR" }, totalAmount: { amount: "0", currencyCode: "INR" } },
    totalQuantity: 0
};

export async function POST() {
    return NextResponse.json(mockCart);
}

export async function PUT() {
    return NextResponse.json(mockCart);
}

export async function DELETE() {
    return NextResponse.json(mockCart);
}
