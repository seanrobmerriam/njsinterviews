import type { Category } from "@prisma/client";

export const CATEGORY_LABELS: Record<Category, string> = {
  ARRAYS_HASHING: "Arrays & Hashing",
  TWO_POINTERS: "Two Pointers",
  SLIDING_WINDOW: "Sliding Window",
  STACK: "Stack",
  BINARY_SEARCH: "Binary Search",
  LINKED_LIST: "Linked List",
  TREES: "Trees",
  TRIES: "Tries",
  HEAP: "Heap / Priority Queue",
  GRAPHS: "Graphs",
  DYNAMIC_PROGRAMMING: "Dynamic Programming",
  GREEDY: "Greedy",
  INTERVALS: "Intervals",
  MATH_GEOMETRY: "Math & Geometry",
  BIT_MANIPULATION: "Bit Manipulation",
  BACKTRACKING: "Backtracking",
  SYSTEM_DESIGN: "System Design",
  BEHAVIORAL: "Behavioral",
  SQL: "SQL",
  FRONTEND: "Frontend",
  GO_TRACK: "Go",
  RUST_TRACK: "Rust",
  PYTHON_TRACK: "Python",
  JAVA_TRACK: "Java",
  CPP_TRACK: "C++",
  TYPESCRIPT_TRACK: "TypeScript",
};

interface CategoryTagProps {
  category: Category;
  className?: string;
}

export function CategoryTag({ category, className = "" }: CategoryTagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${className}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
