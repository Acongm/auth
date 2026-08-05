import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">加载登录页...</div>}>
      <LoginForm />
    </Suspense>
  );
}
