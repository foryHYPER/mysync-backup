import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Auth | mySync",
  description: "Authentication for mySync",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center flex">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[750px]">
        {children}
      </div>
    </div>
  );
} 