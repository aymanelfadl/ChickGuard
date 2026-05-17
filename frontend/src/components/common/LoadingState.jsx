import Card from "./Card.jsx";

export default function LoadingState({ message = "Loading dashboard..." }) {
  return (
    <Card className="min-h-40">
      <div className="flex items-center gap-3 text-sm font-medium text-[#14532D]">
        <span className="h-3 w-3 animate-pulse rounded-full bg-[#22C55E]" />
        {message}
      </div>
    </Card>
  );
}
