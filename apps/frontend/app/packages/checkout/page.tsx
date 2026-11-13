import { requireCurrentUser } from "@/modules/auth/server";
import { CheckoutForm } from "@/modules/billing/CheckoutForm";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ packageId?: string; interval?: "monthly" | "yearly" }>;
}) {
  await requireCurrentUser();
  const { packageId = "", interval = "monthly" } = await searchParams;
  return <CheckoutForm packageId={packageId} billingInterval={interval} />;
}
