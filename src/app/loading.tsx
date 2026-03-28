export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
          <div className="h-5 w-72 bg-gray-100 rounded mx-auto animate-pulse" />
        </div>
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
