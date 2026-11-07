export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* React 19 hoists external async scripts into the document head. */}
      <script async src="https://js.stripe.com/dahlia/stripe.js" />
      {children}
    </>
  );
}
