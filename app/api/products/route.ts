import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schema for product filtering
const filterSchema = z.object({
  category: z.string().optional(),
  priceRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
  certifications: z.array(z.string()).optional(),
  sustainabilityScoreMin: z.number().optional(),
  manufacturerId: z.string().optional(),
  featured: z.boolean().optional(),
  sponsored: z.boolean().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const sort = searchParams.get("sort") || "ranking"
    const order = searchParams.get("order") || "desc"

    // Parse filters
    const filters = filterSchema.parse({
      category: searchParams.get("category"),
      priceRange: searchParams.get("priceRange")
        ? JSON.parse(searchParams.get("priceRange")!)
        : undefined,
      certifications: searchParams.get("certifications")
        ? JSON.parse(searchParams.get("certifications")!)
        : undefined,
      sustainabilityScoreMin: searchParams.get("sustainabilityScoreMin")
        ? parseFloat(searchParams.get("sustainabilityScoreMin")!)
        : undefined,
      manufacturerId: searchParams.get("manufacturerId"),
      featured: searchParams.get("featured")
        ? searchParams.get("featured") === "true"
        : undefined,
      sponsored: searchParams.get("sponsored")
        ? searchParams.get("sponsored") === "true"
        : undefined,
    })

    // Build where clause
    const where: any = {}
    if (filters.category) where.categoryId = filters.category
    if (filters.manufacturerId) where.manufacturerId = filters.manufacturerId
    if (filters.featured !== undefined) where.featured = filters.featured
    if (filters.sponsored !== undefined) where.sponsored = filters.sponsored

    // Add price range filter
    if (filters.priceRange) {
      where.price = {
        amount: {
          gte: filters.priceRange.min,
          lte: filters.priceRange.max,
        },
      }
    }

    // Add sustainability score filter
    if (filters.sustainabilityScoreMin) {
      where.sustainabilityScore = {
        overall: {
          gte: filters.sustainabilityScoreMin,
        },
      }
    }

    // Add certifications filter
    if (filters.certifications?.length) {
      where.certifications = {
        some: {
          certificationId: {
            in: filters.certifications,
          },
        },
      }
    }

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        manufacturer: true,
        sustainabilityScore: true,
        price: true,
        certifications: {
          include: {
            certification: true,
          },
        },
        images: true,
      },
      orderBy: {
        [sort]: order,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get total count for pagination
    const total = await prisma.product.count({ where })

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and has admin/editor role
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    const product = await prisma.product.create({
      data: {
        ...body,
        sustainabilityScore: {
          create: body.sustainabilityScore,
        },
        price: {
          create: body.price,
        },
        images: {
          create: body.images,
        },
        certifications: {
          create: body.certifications.map((cert: string) => ({
            certificationId: cert,
          })),
        },
      },
      include: {
        category: true,
        manufacturer: true,
        sustainabilityScore: true,
        price: true,
        certifications: {
          include: {
            certification: true,
          },
        },
        images: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    )
  }
}
