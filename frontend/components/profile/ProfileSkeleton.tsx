// components/profile/ProfileSkeleton.tsx

export function ProfileSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto animate-pulse">
      {/* Заголовок */}
      <div className="w-full mb-6">
        <div className="h-6 w-24 bg-gray-200 rounded" />
      </div>

      {/* Карточка профиля */}
      <div className="bg-white rounded-lg shadow-xs p-8 w-full mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full" />
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Достижения */}
      <div className="w-full">
        <div className="w-full mb-[20px] bg-white rounded-lg p-[10px] px-[20px]">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
