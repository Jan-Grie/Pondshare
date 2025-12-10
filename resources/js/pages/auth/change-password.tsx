import React, { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AuthLayout from '@/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next';
import force from '@/routes/password/force'


export default function ChangePassword() {
    const { t } = useTranslation() 
    const { data, setData, submit, processing, errors } = useForm({
        password: '',
        password_confirmation: ''
    })

    const [showPwd, setShowPwd] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        submit(force.update())
    }

  return (
    <AuthLayout
      title={t("auth:password.change_required_title")}
      description={t("auth:password.change_required_message")}
    >
      <Head title={t("auth:password.change_required_title")} />

      <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-6 py-10">
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            {t("auth:password.new_password")}
          </label>
          <div className="relative mt-1">
            <Input
              aria-invalid={!!errors.password}
              id="password"
              name="password"
              type={showPwd ? 'text' : 'password'}
              value={data.password}
              onChange={e => setData('password', e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 flex items-center"
              onClick={() => setShowPwd(v => !v)}
            >
              {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="block text-sm font-medium">
            {t("auth:password.confirm_new_password")}
          </label>
          <div className="relative mt-1">
            <Input
              aria-invalid={!!errors.password_confirmation}
              id="password_confirmation"
              name="password_confirmation"
              type={showConfirm ? 'text' : 'password'}
              value={data.password_confirmation}
              onChange={e => setData('password_confirmation', e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 flex items-center"
              onClick={() => setShowConfirm(v => !v)}
            >
              {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="text-red-600 text-sm mt-1">{errors.password_confirmation}</p>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={processing} className="w-full">
            {t("auth:password.update_password")}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
