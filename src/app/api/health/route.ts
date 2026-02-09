import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        version: 'v4-mcp-server',
        timestamp: new Date().toISOString()
    });
}
