import type { ReactNode } from "react";

export default function CaseLayout({
  header,
  left,
  right,
  children,
}: {
  header: ReactNode;
  left: ReactNode;
  right: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="p-8 flex flex-col gap-4">
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-sticky">
        {header}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[35%_65%] lg:grid-cols-[30%_70%] gap-4 md:gap-6">
        <div>{left}</div>
        <div className="flex flex-col gap-4">{right}</div>
      </div>
      {children}
    </div>
  );
}
