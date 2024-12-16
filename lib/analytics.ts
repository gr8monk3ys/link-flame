import { prisma } from "./prisma"

export async function trackPageView({
  path,
  userId,
  sessionId,
  source,
  medium,
  campaign,
}: {
  path: string
  userId?: string
  sessionId: string
  source?: string
  medium?: string
  campaign?: string
}) {
  try {
    await prisma.pageView.create({
      data: {
        path,
        userId,
        sessionId,
        source,
        medium,
        campaign,
      },
    })
  } catch (error) {
    console.error("Error tracking page view:", error)
  }
}

export async function trackAffiliateClick({
  productId,
  userId,
  sessionId,
  source,
  medium,
  campaign,
}: {
  productId: string
  userId?: string
  sessionId: string
  source?: string
  medium?: string
  campaign?: string
}) {
  try {
    await prisma.affiliateClick.create({
      data: {
        productId,
        userId,
        sessionId,
        source,
        medium,
        campaign,
      },
    })
  } catch (error) {
    console.error("Error tracking affiliate click:", error)
  }
}

export async function updateAffiliateConversion({
  sessionId,
  productId,
  revenue,
}: {
  sessionId: string
  productId: string
  revenue: number
}) {
  try {
    await prisma.affiliateClick.updateMany({
      where: {
        sessionId,
        productId,
        converted: false,
      },
      data: {
        converted: true,
        revenue,
      },
    })
  } catch (error) {
    console.error("Error updating affiliate conversion:", error)
  }
}

export async function getAnalytics({
  startDate,
  endDate,
}: {
  startDate: Date
  endDate: Date
}) {
  try {
    const [pageViews, affiliateClicks, conversions] = await Promise.all([
      // Get page views
      prisma.pageView.groupBy({
        by: ["path"],
        where: {
          viewedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),

      // Get affiliate clicks
      prisma.affiliateClick.groupBy({
        by: ["productId"],
        where: {
          clickedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),

      // Get conversions and revenue
      prisma.affiliateClick.groupBy({
        by: ["productId"],
        where: {
          clickedAt: {
            gte: startDate,
            lte: endDate,
          },
          converted: true,
        },
        _count: true,
        _sum: {
          revenue: true,
        },
      }),
    ])

    return {
      pageViews,
      affiliateClicks,
      conversions,
    }
  } catch (error) {
    console.error("Error getting analytics:", error)
    throw error
  }
}
