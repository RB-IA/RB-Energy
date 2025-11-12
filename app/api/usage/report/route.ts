import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { calculateCost } from "@/lib/pricing";

export const runtime = "nodejs";

const prisma = new PrismaClient();

interface UsageReport {
  sessionId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp?: string;
}

/**
 * Endpoint to receive usage reports from ChatKit workflow or client
 * POST /api/usage/report
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UsageReport;
    const {
      sessionId,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      timestamp,
    } = body;

    if (!sessionId || !model || totalTokens === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const cost = calculateCost(model, promptTokens, completionTokens);

    // Ensure session exists
    await prisma.usageSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        userId: null,
        startTime: timestamp ? new Date(timestamp) : new Date(),
      },
      update: {},
    });

    // Log the usage
    const log = await prisma.usageLog.create({
      data: {
        sessionId,
        model,
        tokensInput: promptTokens,
        tokensOutput: completionTokens,
        tokensTotal: totalTokens,
        cost,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    // Update daily aggregate
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyAggregate.upsert({
      where: { date: today },
      create: {
        date: today,
        totalRequests: 1,
        tokensInput: promptTokens,
        tokensOutput: completionTokens,
        tokensTotal: totalTokens,
        totalCost: cost,
        modelBreakdown: { [model]: { requests: 1, tokens: totalTokens, cost } },
      },
      update: {
        totalRequests: { increment: 1 },
        tokensInput: { increment: promptTokens },
        tokensOutput: { increment: completionTokens },
        tokensTotal: { increment: totalTokens },
        totalCost: { increment: cost },
      },
    });

    return NextResponse.json({
      success: true,
      logged: {
        id: log.id,
        sessionId,
        tokens: totalTokens,
        cost,
      },
    });
  } catch (error) {
    console.error("Error reporting usage:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
