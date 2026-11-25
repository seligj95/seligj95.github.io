export function blogPostPath(id: string, base = import.meta.env.BASE_URL): string {
  return `${base.replace(/\/+$/, "")}/blog/${id}/`;
}
