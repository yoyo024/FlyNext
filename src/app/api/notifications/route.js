// As a user, I want to receive notifications when I book a new itinerary,
// and when there are external changes to my booking (e.g., cancellation
// by me or hotel owner).
//
// /api/notification

import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";
import { prisma } from "@/utils/db";

async function GET_notification(request) {
  try {
    let unreadOnly = false;
    const { searchParams } = new URL(request.url);
    unreadOnly = searchParams.get("unreadOnly");

    const userId = request.user.id;

    let notifications;
    if (unreadOnly && JSON.parse(unreadOnly.toLowerCase())) {
      notifications = await prisma.notification.findMany({
        where: { userId: userId },
        orderBy: { createdAt: "desc" },
      });
    } else {
      notifications = await prisma.notification.findMany({
        where: { userId: userId },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.log("Error getting notification:", error);
    return NextResponse.json(
      { message: "Error getting notification" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(GET_notification);
