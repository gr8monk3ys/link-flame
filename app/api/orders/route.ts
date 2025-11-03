import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  handleApiError,
} from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedResponse();
    }

    // Fetch user's orders with order items
    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return successResponse(
      { orders, count: orders.length },
      { message: "Orders retrieved successfully" }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
