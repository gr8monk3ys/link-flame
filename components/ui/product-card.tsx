import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

const ProductCard = ({ product }) => (
  <Card key={product.id}>
    <CardHeader>
      <AspectRatio ratio={1}>
        <img src={product.image} alt={product.title} />
      </AspectRatio>
    </CardHeader>
    <CardContent>
      <CardTitle>{product.title}</CardTitle>
      <CardDescription>{product.description}</CardDescription>
    </CardContent>
    <CardFooter>
      <a href={product.url} target="_blank" rel="noreferrer" className={buttonVariants()}>
        View Product
      </a>
    </CardFooter>
  </Card>
)

export default ProductCard
