const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  OPENED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  EXPIRED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      role="status"
      aria-label={`Status: ${status.replace("_", " ").toLowerCase()}`}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES["PENDING"]}`}
    >
      {status.replace("_", " ").charAt(0) + status.replace("_", " ").slice(1).toLowerCase()}
    </span>
  );
}
