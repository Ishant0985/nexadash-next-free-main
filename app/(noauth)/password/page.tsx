'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/firebaseClient'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import toast from 'react-hot-toast'

export default function Password() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [oobCode, setOobCode] = useState<string | null>(null)

    useEffect(() => {
        const code = searchParams.get('oobCode')
        if (!code) {
            toast.error('Invalid password reset link')
            router.push('/login')
            return
        }

        const verifyCode = async () => {
            try {
                await verifyPasswordResetCode(auth, code)
                setOobCode(code)
            } catch (error) {
                console.error('Error verifying reset code:', error)
                toast.error('Invalid or expired reset link')
                router.push('/login')
            } finally {
                setVerifying(false)
            }
        }

        verifyCode()
    }, [searchParams, router])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }
        if (!oobCode) {
            toast.error('Invalid reset code')
            return
        }

        setLoading(true)
        try {
            await confirmPasswordReset(auth, oobCode, password)
            toast.success('Password reset successful!')
            router.push('/login')
        } catch (error) {
            console.error('Error resetting password:', error)
            toast.error('Failed to reset password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Verifying reset link...</p>
            </div>
        )
    }

    return (
        <div className="grid h-screen w-full gap-5 p-4 md:grid-cols-2">
            <div className="relative hidden overflow-hidden rounded-[20px] bg-[#3B06D2] p-4 md:block md:h-[calc(100vh_-_32px)]">
                <Image
                    src="/images/logo-white.svg"
                    width={145}
                    height={34}
                    alt="Logo"
                    className="absolute left-4 top-4 z-10 h-auto w-auto"
                />
                <Image
                    src="/images/login-cover-step.svg"
                    width={240}
                    height={240}
                    alt="Logo Cover Step"
                    className="absolute left-0 top-0.5 size-40 md:h-auto md:w-auto"
                />
                <Image
                    src="/images/login-cover-cartoon.svg"
                    width={145}
                    height={34}
                    alt="Logo Cover Cartoon"
                    className="absolute bottom-0 left-0 right-0 h-52 w-full md:h-96"
                />
                <div className="absolute left-1/2 top-1/4 w-full max-w-md -translate-x-1/2 space-y-3 px-3 text-center text-white">
                    <h2 className="text-lg font-bold sm:text-2xl lg:text-[30px]/9">
                        Turn your ideas into reality.
                    </h2>
                    <p className="text-sm lg:text-xl/[30px]">
                        Encourages making dreams tangible through effort and
                        creativity.
                    </p>
                </div>
            </div>
            <div className="flex overflow-y-auto py-2">
                <Card className="m-auto w-full max-w-[400px] space-y-[30px] p-5 shadow-sm md:w-[400px]">
                    <CardHeader className="space-y-2">
                        <h2 className="text-xl/tight font-semibold text-black">
                            Set new password
                        </h2>
                        <p className="font-medium leading-tight">
                            Must be at least 8 characters
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-[30px]" onSubmit={handleSubmit}>
                            <div className="relative space-y-3">
                                <label className="block font-semibold leading-none text-black">
                                    New password
                                </label>
                                <Input
                                    type="password"
                                    variant={'input-form'}
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="relative space-y-3">
                                <label className="block font-semibold leading-none text-black">
                                    Confirm password
                                </label>
                                <Input
                                    type="password"
                                    variant={'input-form'}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                variant={'default'}
                                size={'lg'}
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Resetting...' : 'Reset password'}
                            </Button>
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 pl-1.5 text-sm/tight font-semibold text-black hover:text-[#3C3C3D]"
                            >
                                <ArrowLeft className="size-[18px]" />
                                Back to Login
                            </Link>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
