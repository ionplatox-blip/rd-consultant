import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        version: 'v7-mcp-fix',
        timestamp: new Date().toISOString()
    });
}
