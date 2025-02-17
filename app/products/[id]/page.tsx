import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { StarIcon } from '@heroicons/react/20/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/lib/prisma';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: { toString: () => string };
  image: string;
  reviews: { rating: number }[];
}

async function getProduct(id: string): Promise<Product> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return product;
}

type ParamsType = Promise<{ id: string }>;
type SearchParamsType = Promise<{ [key: string]: string | string[] | undefined }>;

interface Props {
  params: ParamsType;
  searchParams: SearchParamsType;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return {
    title: product.title,
    description: product.description || undefined,
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  const averageRating = product.reviews.length 
    ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
    : null;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
              <div className="grid grid-cols-4 gap-6">
                {[product.image].map((image) => (
                  <div
                    key={image}
                    className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase hover:bg-gray-50"
                  >
                    <span className="absolute inset-0 overflow-hidden rounded-md">
                      <Image
                        src={image}
                        alt=""
                        width={200}
                        height={200}
                        className="size-full object-cover object-center"
                        unoptimized
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="aspect-[3/2] overflow-hidden rounded-lg">
              <Image
                src={product.image}
                alt={product.title}
                className="size-full object-cover object-center"
                width={400}
                height={400}
              />
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.title}</h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">
                ${Number(product.price).toFixed(2)}
              </p>
            </div>

            {/* Reviews */}
            {averageRating && (
              <div className="mt-3">
                <h3 className="sr-only">Reviews</h3>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <div key={rating} className="shrink-0">
                        <StarIcon className="size-5" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                  <p className="sr-only">{averageRating} out of 5 stars</p>
                  <div className="ml-3 text-sm font-medium text-green-600 hover:text-green-500">
                    {product.reviews.length} reviews
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <p className="text-base text-gray-900">{product.description}</p>
            </div>

            <div className="mt-6">
              {/* Subscription options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Delivery</h3>
                  <button
                    type="button"
                    className="text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    Learn more
                  </button>
                </div>

                <div>
                  <select
                    className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-green-600 sm:text-sm sm:leading-6"
                    defaultValue="monthly"
                  >
                    <option value="onetime">One-time purchase</option>
                    <option value="monthly">Delivery every 1 Month</option>
                    <option value="bimonthly">Delivery every 2 Months</option>
                    <option value="quarterly">Delivery every 3 Months</option>
                  </select>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <InformationCircleIcon className="size-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">
                        Subscribe and save 15%. Cancel anytime. Free shipping on orders over $35.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex">
                <button
                  type="button"
                  className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-green-600 px-8 py-3 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
