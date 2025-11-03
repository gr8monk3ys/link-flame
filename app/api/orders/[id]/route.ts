import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  handleApiError,
} from "@/lib/api-response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: {
        id,
        userId, // Ensure user can only access their own orders
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return notFoundResponse("Order");
    }

    return successResponse(
      { order },
      { message: "Order retrieved successfully" }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
