import { Input } from "@/components/ui/input"

export function Search() {
  return (
    <div>
      <Input name="q" autoComplete="off" aria-label="Search"
        type="search"
        placeholder="Search…"
        className="h-9 md:w-[100px] lg:w-[300px]"
      />
    </div>
  )
}