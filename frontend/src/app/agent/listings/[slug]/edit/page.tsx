// src/app/agent/listings/[slug]/edit/page.tsx
/**
 * Edit a listing.
 *
 * Both the listings table and the dashboard link to
 * /agent/listings/<slug>/edit, but this route never existed — those Edit
 * buttons produced a 404. It mirrors /agent/listings/new by handing off to the
 * admin panel, passing the slug so the form opens on that property.
 */
import { redirect } from "next/navigation";

export default function EditListingPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/agent/admin?edit=${encodeURIComponent(params.slug)}`);
}
