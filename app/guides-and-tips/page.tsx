import Link from "next/link"

// This is dummy data for demonstration purposes
const categories = [
  {
    id: '1',
    title: 'Health',
    blogs: [
      { id: '1', title: 'Health Blog 1', url: '/blogs/health-1' },
      // Add more health blogs as needed
    ],
  },
  {
    id: '2',
    title: 'Fitness',
    blogs: [
      { id: '1', title: 'Fitness Blog 1', url: '/blogs/fitness-1' },
      // Add more fitness blogs as needed
    ],
  },
  {
    id: '3',
    title: 'Sustainability',
    blogs: [
      { id: '1', title: 'Sustainability Blog 1', url: '/blogs/sustainability-1' },
      // Add more sustainability blogs as needed
    ],
  },
];

export default function GuidesAndTipsPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Guides and Tips for Health, Wellness, and Sustainability
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Dive deeper into the topics of health, wellness, and sustainability with our expert guides and tips. Learn more and enhance your lifestyle today.
        </p>
      </div>

      {categories.map(category => (
        <div key={category.id}>
          <h2 className="mt-4 text-2xl font-bold">{category.title}</h2>
          <ul>
            {category.blogs.map(blog => (
              <li key={blog.id}>
                <Link href={blog.url} className="text-blue-500 hover:text-blue-800">
                  {blog.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
