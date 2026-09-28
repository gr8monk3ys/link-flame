export interface NavLink {
  title: string
  href: string
  description?: string
  disabled?: boolean
  external?: boolean
}

/** A top-level nav entry: either a direct link (`href`) or a dropdown (`items`). */
export interface NavItem {
  title: string
  href?: string
  items?: NavLink[]
  disabled?: boolean
  external?: boolean
}
