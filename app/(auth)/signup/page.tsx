"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

const registerSchema = z.object({
  displayName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SignupPage() {
  const { mutate: register, isPending } = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) => {
    register(data);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white font-sans">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">ZaloChat</h2>
          <p className="mt-2 text-sm text-slate-500">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Họ và tên"
              className="h-12"
              {...registerField("displayName")}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-600">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email"
              className="h-12"
              {...registerField("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Mật khẩu"
              className="h-12"
              {...registerField("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-semibold">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
