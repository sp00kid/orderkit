interface SkeletonProps {
  rows: number;
}

export function Skeleton({ rows }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="ok-skeleton-row">
          <div className="ok-skeleton-bar" />
          <div className="ok-skeleton-bar" />
          <div className="ok-skeleton-bar" />
        </div>
      ))}
    </>
  );
}
