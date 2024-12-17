import { ColumnDef } from "@tanstack/react-table"
import { Category, Product, SustainabilityScore, Price, ProductImage } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"

export type ProductWithRelations = Product & {
  category: Category;
  sustainabilityScore: SustainabilityScore | null;
  price: Price | null;
  images: ProductImage[];
}

export const columns: ColumnDef<ProductWithRelations>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category
      return <div>{category.name}</div>
    },
  },
  {
    accessorKey: "sustainabilityScore",
    header: "Eco Score",
    cell: ({ row }) => {
      const score = row.original.sustainabilityScore
      return score ? <StarRating rating={score.overall} /> : null
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.original.price
      return price ? (
        <div>
          ${price.amount.toFixed(2)}
          {price.unit && (
            <span className="text-sm text-muted-foreground">
              {" "}
              / {price.unit}
            </span>
          )}
        </div>
      ) : null
    },
  },
  {
    accessorKey: "featured",
    header: "Status",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          {row.original.featured && (
            <Badge variant="secondary">Featured</Badge>
          )}
          {row.original.sponsored && (
            <Badge variant="outline">Sponsored</Badge>
          )}
        </div>
      )
    },
  },
]
