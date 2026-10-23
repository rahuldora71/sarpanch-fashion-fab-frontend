export default function CustomerLoadingState() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-3 gap-4 px-5 py-5 xl:grid-cols-8"
        >
          {Array.from({ length: 8 }).map((__, cell) => (
            <div
              key={cell}
              className={`
                h-4 animate-pulse rounded-md
                bg-muted
                ${
                  cell === 0
                    ? "xl:col-span-2"
                    : ""
                }
              `}
            />
          ))}
        </div>
      ))}
    </div>
  );
}