export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function LoadingState({ children }: { children: React.ReactNode }) {
  return (
    <div className="loading-state">
      <Spinner />
      {children}
    </div>
  );
}
