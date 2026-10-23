export default function CustomerTableHeader() {
  return (
    <div
      className="
        grid
        grid-cols-[minmax(280px,2.2fr)_1fr_1fr_.55fr_1fr_.8fr_1fr_70px]
        items-center
        border-b border-border
        bg-muted/50
        px-5
        py-3
        text-[11px]
        font-semibold
        uppercase
        tracking-wide
        text-muted-foreground
      "
    >
      <div>Customer</div>
      <div>Code</div>
      <div>Phone</div>
      <div>Orders</div>
      <div>Total Spent</div>
      <div>Balance</div>
      <div>Last Order</div>
      <div />
    </div>
  );
}