// ... have it updated as I read them.

//
// /api/notification/:nid

import { NextResponse } from "next/server";
import { withAuth } from "@/utils/auth";
import { prisma } from "@/utils/db";

async function PUT_read(request, {params}) {
  try {
    const { nid } = params;
    const nid_int = parseInt(nid);

    if (!nid_int) {
      return NextResponse.json(
        { error: 'missing notificationId to update notification' }, { status: 400 }
      );
    }

    // update notification
    const noti = await prisma.Notification.update({
      where: { id: nid_int },
      data: { isRead: true }
    });

    return NextResponse.json(
      {
        message: 'notification updated successfully',
        notification: noti
      }, 
      { status: 200 });

  } catch (error) {
    console.log('Error updating notification:', error);
    return NextResponse.json({ message: 'Error updating notification' }, { status: 500 });
  }
}

export const PUT = withAuth(PUT_read);
