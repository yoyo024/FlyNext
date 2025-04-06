import { prisma } from "@/utils/db";

// Helper function to check if a room is already booked
export async function checkRoomBooked(room, startDate, endDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const bookedCount = await prisma.booking.count({
        where: {
            roomId: Number(room.id),
            OR: [
                {
                    status: "CONFIRMED",
                    checkIn: {
                        lt: endDate // Booking's check-in is before requested end date
                    },
                    checkOut: {
                        gt: startDate // Booking's check-out is after requested start date
                    }
                },
                {
                    status: "PENDING",
                    reserveTime: {
                        lt: yesterday // Reservation expired
                    },
                    checkIn: {
                        lt: endDate
                    },
                    checkOut: {
                        gt: startDate
                    }
                }
            ]
        }
    })

    return bookedCount > 0; // If any date is booked, return true
}