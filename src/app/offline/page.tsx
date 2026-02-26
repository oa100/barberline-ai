export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center">
        <h1 className="mb-4 font-serif text-3xl text-cream">
          You&apos;re Offline
        </h1>
        <p className="text-warm-gray">
          BarberLine AI needs an internet connection. Please check your
          connection and try again.
        </p>
      </div>
    </div>
  );
}
