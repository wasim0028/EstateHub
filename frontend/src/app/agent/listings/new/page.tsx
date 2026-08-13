// src/app/agent/listings/new/page.tsx
// Redirects to the admin panel pre-opened on the "Add property" form
import { redirect } from "next/navigation";

export default function NewListingPage() {
  redirect("/agent/admin");
}
