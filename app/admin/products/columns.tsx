import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { format } from "date-fns"

export type ProductWithRelations = Product & {
  reviews: {
    rating: number;
  }[];
}

export const columns: ColumnDef<ProductWithRelations>[] = [
  {
    accessorKey: "title",
    header: "Title"
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => formatPrice(row.original.price)
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => format(new Date(row.original.createdAt), "PPP")
  },
  {
    accessorKey: "reviews",
    header: "Rating",
    cell: ({ row }) => {
      const reviews = row.original.reviews
      if (!reviews.length) return "No ratings"
      
      const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      return <StarRating rating={avgRating} />
    }
  }
]

function formatPrice(price: number): JSX.Element {
  return (
    <div className="flex flex-col">
      <span>${price.toFixed(2)}</span>
    </div>
  );
}
