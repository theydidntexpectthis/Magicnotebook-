import React from "react";
import { cn } from "@/lib/utils";

type StickyNoteColor = "green" | "yellow" | "pink" | "blue" | "purple" | "orange";

interface StickyNoteProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: StickyNoteColor;
  children: React.ReactNode;
}

const colorClasses = {
  green: "bg-lime-200 hover:bg-lime-300",
  yellow: "bg-amber-200 hover:bg-amber-300",
  pink: "bg-red-200 hover:bg-red-300",
  blue: "bg-blue-200 hover:bg-blue-300",
  purple: "bg-purple-200 hover:bg-purple-300",
  orange: "bg-orange-200 hover:bg-orange-300",
};

const StickyNote = ({
  color = "yellow",
  className,
  children,
  ...props
}: StickyNoteProps) => {
  return (
    <div
      className={cn(
        "relative p-4 rounded-sm shadow-md transition-all duration-200",
        "before:content-[''] before:absolute before:w-full before:h-full before:-z-10",
        "before:left-1 before:top-1 before:bg-gray-100/40 before:rounded-sm",
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { StickyNote };