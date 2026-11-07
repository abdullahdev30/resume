import { requireCurrentUser } from "@/modules/auth/server";
import { CheckoutForm } from "@/modules/billing/CheckoutForm";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ packageId?: string }>;
}) {
  await requireCurrentUser();
  const { packageId = "" } = await searchParams;
  return <CheckoutForm packageId={packageId} />;
}
