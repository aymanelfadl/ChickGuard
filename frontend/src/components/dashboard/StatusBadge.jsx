import { getStatusClassName, getStatusLabel } from "../../utils/statusUtils.js";

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getStatusClassName(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
