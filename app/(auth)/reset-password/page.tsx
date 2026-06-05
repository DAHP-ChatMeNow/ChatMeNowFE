"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { useResetPassword } from "@/hooks/use-auth";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!token) {
      return;
    }
    resetPassword({
      token,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Thiếu mã đặt lại mật khẩu</h2>
          <p className="text-sm text-slate-600 max-w-sm">
            Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token. Vui lòng kiểm tra lại liên kết trong email của bạn.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Yêu cầu liên kết mới
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Password Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
        <div className="relative">
          <Lock className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu mới"
            className="h-12 pl-10 pr-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={isPending}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute transition-colors -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
        <div className="relative">
          <Lock className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Xác nhận mật khẩu mới"
            className="h-12 pl-10 pr-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            disabled={isPending}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute transition-colors -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-12 font-semibold text-white transition-all shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-blue-500/30"
      >
        {isPending ? "Đang cập nhật..." : "Đổi mật khẩu"}
      </Button>
    </form>
  );
}

// Generate particles array outside component to avoid impure function error
const generateParticles = () =>
  Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    width: 4 + Math.random() * 10,
    height: 4 + Math.random() * 10,
    left: i * 6.25 + Math.random() * 5,
    color: [
      "rgba(99,102,241,0.2)",
      "rgba(139,92,246,0.18)",
      "rgba(37,99,235,0.15)",
      "rgba(16,185,129,0.15)",
    ][i % 4],
    duration: 6 + Math.random() * 10,
    delay: Math.random() * 8,
  }));

const PARTICLES = generateParticles();

export default function ResetPasswordPage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-8 overflow-hidden bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      {/* Animated blobs */}
      <div
        className="absolute rounded-full pointer-events-none -top-32 -right-32 h-96 w-96 bg-blue-200/40 blur-3xl"
        style={{ animation: "blobMove1 8s ease-in-out infinite" }}
      />
      <div
        className="absolute rounded-full pointer-events-none -bottom-32 -left-32 h-80 w-80 bg-violet-200/35 blur-3xl"
        style={{ animation: "blobMove2 10s ease-in-out infinite" }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              left: `${particle.left}%`,
              bottom: "-20px",
              background: particle.color,
              animation: `floatUp ${particle.duration}s ${particle.delay}s linear infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Form Card */}
        <div className="p-8 space-y-6 bg-white shadow-xl rounded-3xl border border-white/80 bg-white/90 backdrop-blur-md">
          {/* Logo and Title */}
          <div className="space-y-2 text-center">
            <Link href="/">
              <div className="inline-block p-3 bg-blue-600 rounded-2xl cursor-pointer hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </Link>
            <h2 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h2>
            <p className="text-sm text-slate-600">
              Nhập mật khẩu mới của bạn bên dưới để khôi phục tài khoản
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-6 text-sm text-slate-500">
                <svg
                  className="w-8 h-8 animate-spin text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="mt-2">Đang tải...</span>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/0 text-slate-500">hoặc</span>
            </div>
          </div>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-center text-slate-500">
          <p>© 2026 Chat Me Now. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
