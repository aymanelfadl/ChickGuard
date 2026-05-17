import LoadingState from "../common/LoadingState.jsx";

export default function ProtectedRoute({ isAuthenticated, isLoading, loginPage, children }) {
  if (isLoading) {
    return (
      <main className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-xl">
          <LoadingState message="Checking session..." />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return loginPage;
  }

  return children;
}
