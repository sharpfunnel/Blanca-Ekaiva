import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

// `useSearchParams` inside LoginForm needs a Suspense boundary during render.
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
