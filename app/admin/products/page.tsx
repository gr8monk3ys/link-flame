import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import ProductCard from "@/components/ui/product-card"

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const products = await prisma.product.findMany({
    include: {
      reviews: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <a href="/admin/products/new" className="btn-primary">
          Add Product
        </a>
      </div>
      <div className="mt-6">
        <DataTable columns={columns} data={products} />
      </div>
    </div>
  )
}
