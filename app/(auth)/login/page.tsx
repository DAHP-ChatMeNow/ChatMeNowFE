"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const router = useRouter()

  const handleLogin = () => {
    login({ name: "User Test" })
    router.push("/messages")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white font-sans">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">ZaloChat</h2>
          <p className="mt-2 text-sm text-slate-500">Chào mừng bạn quay trở lại</p>
        </div>

        <div className="space-y-4">
          <Input type="tel" placeholder="Số điện thoại" className="h-12" />
          <Input type="password" placeholder="Mật khẩu" className="h-12" />
          <Button 
            onClick={handleLogin}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold"
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    </div>
  )
}