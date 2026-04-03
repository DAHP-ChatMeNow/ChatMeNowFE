"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import {
  useLogin,
  useRememberedLogin,
  useRevokeRememberedAccount,
} from "@/hooks/use-auth";
import { userService } from "@/api/user";
import { useAuthStore } from "@/store/use-auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { PresignedAvatar } from "@/components/ui/presigned-avatar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Mail, Lock, X } from "lucide-react";
import { getDeviceId, getDeviceName } from "@/lib/device-utils";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const isDirectAvatarUrl = (avatar?: string) =>
  Boolean(
    avatar &&
    (avatar.startsWith("http://") ||
      avatar.startsWith("https://") ||
      avatar.startsWith("data:") ||
      avatar.startsWith("blob:") ||
      avatar.startsWith("/")),
  );

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const { mutate: rememberedLogin, isPending: isRememberedLoginPending } =
    useRememberedLogin();
  const { mutate: revokeAccount, isPending: isRevokePending } =
    useRevokeRememberedAccount();
  const addRememberedAccount = useAuthStore(
    (state) => state.addRememberedAccount,
  );
  const rememberedAccounts = useAuthStore((state) => state.rememberedAccounts);
  const enrichedTokensRef = useRef<Set<string>>(new Set());

  const [showPassword, setShowPassword] = useState(false);
  const [rememberAccount, setRememberAccount] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [showLoginForm, setShowLoginForm] = useState(
    rememberedAccounts.length === 0,
  );

  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const formErrorMessage = useMemo(() => {
    if (loginError) return loginError;
    if (turnstileError) return turnstileError;
    return "";
  }, [loginError, turnstileError]);

  useEffect(() => {
    const enrichAvatars = async () => {
      for (const account of rememberedAccounts) {
        if (enrichedTokensRef.current.has(account.rememberToken)) continue;
        enrichedTokensRef.current.add(account.rememberToken);

        try {
          let avatar = account.rememberProfile.avatar;

          // Old remembered entries may not store avatar; try refetching by user id.
          if (!avatar) {
            const user = await userService.getUserById(
              account.rememberProfile.id,
            );
            avatar = user.avatar;
          }

          // If avatar is object key (not URL), resolve to view URL for login screen.
          if (avatar && !isDirectAvatarUrl(avatar)) {
            const presigned = await userService.getPresignedUrl(avatar);
            avatar = presigned.viewUrl;
          }

          if (avatar && avatar !== account.rememberProfile.avatar) {
            addRememberedAccount({
              ...account,
              rememberProfile: {
                ...account.rememberProfile,
                avatar,
              },
            });
          }
        } catch {
          // Keep fallback avatar when enrichment fails.
        }
      }
    };

    if (rememberedAccounts.length > 0) {
      enrichAvatars();
    }
  }, [rememberedAccounts, addRememberedAccount]);

  const onSubmit = (data: LoginFormValues) => {
    setLoginError("");
    setTurnstileError("");

    if (!turnstileSiteKey) {
      setTurnstileError(
        "Thiếu site key Turnstile. Hãy cấu hình NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY.",
      );
      return;
    }

    if (!turnstileToken) {
      setTurnstileError(
        "Vui lòng hoàn thành xác thực Turnstile trước khi đăng nhập.",
      );
      return;
    }

    login(
      {
        ...data,
        turnstileToken,
        rememberAccount,
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
      },
      {
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Đăng nhập thất bại. Vui lòng thử lại.";

          setLoginError(message);
          setTurnstileToken("");
          setTurnstileResetSignal((prev) => prev + 1);
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#e0eaff_0%,_#f8fbff_42%,_#ffffff_100%)] px-4 py-8 sm:px-6">
      {/* Accounts List Page - Show when user has saved accounts and not in login form */}
      {!showLoginForm && rememberedAccounts.length > 0 ? (
        <div className="w-full max-w-3xl text-center">
          {/* Logo */}
          <div className="mb-8 space-y-3 sm:mb-10">
            <Link href="/">
              <div className="inline-block cursor-pointer rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 shadow-lg shadow-blue-200 transition-transform duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800">
                <svg
                  className="w-10 h-10 text-white"
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
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Chat Me Now
            </h1>
            <p className="text-base font-medium text-slate-600">
              Chọn tài khoản để tiếp tục
            </p>
          </div>

          {/* Accounts Grid */}
          <div className="flex flex-wrap justify-center gap-4 mb-7 sm:gap-5">
            {rememberedAccounts.map((account) => (
              <div
                key={account.rememberToken}
                className="relative w-full group sm:w-[calc(50%-0.625rem)] lg:w-[280px]"
              >
                <button
                  onClick={() => {
                    rememberedLogin({
                      rememberToken: account.rememberToken,
                      deviceId: account.rememberProfile.deviceId,
                    });
                  }}
                  disabled={isRememberedLoginPending}
                  className="relative flex w-full items-center justify-start gap-3 rounded-3xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_16px_35px_-20px_rgba(37,99,235,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 sm:flex-col sm:justify-center sm:gap-4 sm:p-6"
                >
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 rounded-3xl bg-gradient-to-b from-white/0 to-blue-50/40 group-hover:opacity-100" />
                  {/* Avatar */}
                  <PresignedAvatar
                    avatarKey={account.rememberProfile.avatar}
                    displayName={account.rememberProfile.displayName}
                    className="relative z-10 w-16 h-16 ring-2 ring-blue-100 sm:h-24 sm:w-24"
                    fallbackClassName="text-2xl font-bold"
                  />
                  {/* Name and Email */}
                  <div className="relative z-10 flex-1 min-w-0 text-left sm:flex-none sm:text-center">
                    <p className="text-lg font-semibold truncate text-slate-900">
                      {account.rememberProfile.displayName}
                    </p>
                    <p className="hidden mt-1 text-xs truncate text-slate-500 sm:block">
                      {account.rememberProfile.email}
                    </p>
                  </div>
                </button>

                {/* Delete Button - Appears on Hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    revokeAccount({
                      rememberToken: account.rememberToken,
                      deviceId: account.rememberProfile.deviceId,
                    });
                  }}
                  disabled={isRevokePending}
                  className="absolute p-1 transition-all right-3 top-3 text-slate-400 hover:text-slate-700 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Xóa tài khoản này"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Use Another Account Button */}
          <button
            type="button"
            onClick={() => setShowLoginForm(true)}
            className="w-full rounded-2xl border border-blue-200/80 bg-white py-4 text-center text-lg font-semibold text-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
          >
            + Sử dụng tài khoản khác
          </button>

          {/* Footer */}
          <div className="text-xs text-center mt-7 text-slate-500">
            <p>© 2026 Chat Me Now. All rights reserved.</p>
          </div>
        </div>
      ) : (
        // Login Form Page
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="p-8 space-y-6 bg-white shadow-xl rounded-3xl">
            {/* Logo and Title */}
            <div className="space-y-2 text-center">
              <Link href="/">
                <div className="inline-block p-3 transition-colors bg-blue-600 cursor-pointer rounded-2xl hover:bg-blue-700">
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
              <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    className="h-12 pl-10 pr-4 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu của bạn"
                    className="h-12 pl-10 pr-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute transition-colors -translate-y-1/2 right-3 top-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Account Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberAccount}
                  onChange={(e) => setRememberAccount(e.target.checked)}
                  className="w-4 h-4 border rounded cursor-pointer border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="remember"
                  className="text-sm cursor-pointer text-slate-600"
                >
                  Ghi nhớ tài khoản này
                </label>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <div className="flex flex-col items-center space-y-2">
                {turnstileSiteKey ? (
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    resetSignal={turnstileResetSignal}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                      setTurnstileError("");
                    }}
                    onExpire={() => {
                      setTurnstileToken("");
                      setTurnstileError(
                        "Phiên xác thực Turnstile đã hết hạn. Vui lòng xác thực lại.",
                      );
                    }}
                    onError={(message) => {
                      setTurnstileToken("");
                      setTurnstileError(message);
                    }}
                  />
                ) : (
                  <p className="text-xs text-red-600">
                    Thiếu site key Turnstile. Hãy thêm biến môi trường
                    NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY.
                  </p>
                )}
              </div>

              {formErrorMessage && (
                <p className="text-sm text-red-600" role="alert">
                  {formErrorMessage}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isPending || !turnstileSiteKey}
                className="w-full h-12 font-semibold text-white transition-all shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5 animate-spin"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">hoặc</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-slate-600">
                Chưa có tài khoản?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>

            {/* Back to Accounts Button */}
            {rememberedAccounts.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLoginForm(false)}
                  className="w-full py-2 text-sm font-medium text-center transition-all text-slate-600 hover:text-slate-900 hover:underline"
                >
                  ← Quay lại chọn tài khoản
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-xs text-center text-slate-500">
            <p>© 2026 Chat Me Now. All rights reserved.</p>
          </div>
        </div>
      )}
    </div>
  );
}
