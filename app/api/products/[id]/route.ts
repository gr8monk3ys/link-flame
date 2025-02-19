import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  id: string;
}

export async function GET(
  request: Request,
  { params }: { params: any }
) {
  try {
    const { id } = params;

    if (!id) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
