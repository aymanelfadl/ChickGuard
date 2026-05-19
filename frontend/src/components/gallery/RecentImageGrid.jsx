import EmptyState from "../common/EmptyState.jsx";
import ImageAnalysisCard from "./ImageAnalysisCard.jsx";

export default function RecentImageGrid({ images, emptyTitle = "No droppings images yet", emptyMessage }) {
  if (!images?.length) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage || "Uploaded poultry droppings images will appear here after analysis."}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {images.map((item) => (
        <ImageAnalysisCard key={item.id} item={item} />
      ))}
    </div>
  );
}

