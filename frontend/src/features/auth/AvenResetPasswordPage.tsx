import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AvenAuthLayout } from './AvenAuthLayout';
import { AvenLogo } from '../../components/aven/AvenLogo';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export const AvenResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const passwordVal = watch('password', '');

  // Minimal strength indicator logic
  const getStrength = (pass: string) => {
    if (!pass) return { label: 'Weak', percent: 0, color: 'bg-neutral-300 dark:bg-neutral-700' };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { label: 'Strong', percent: 100, color: 'bg-emerald-500' };
    }
    if (pass.length >= 6) {
      return { label: 'Medium', percent: 60, color: 'bg-amber-500' };
    }
    return { label: 'Weak', percent: 25, color: 'bg-red-500' };
  };

  const strength = getStrength(passwordVal);

  const onSubmit = async (data: ResetFormData) => {
    setApiError(null);

    if (!token) {
      const msg = 'Invalid or missing reset token. Please request a new password reset link.';
      setApiError(msg);
      toast.error('Reset Failed', { description: msg });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.resetPassword(token, data.password);
      toast.success('Password Reset Successful', {
        description: res.message || 'Your password has been updated. Please sign in.',
      });
      navigate('/login');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to reset password. Token may be expired or invalid.';
      setApiError(errorMsg);
      toast.error('Reset Error', { description: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AvenAuthLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Single Brand Logo */}
        <AvenLogo size="lg" align="center" />

        {/* Section Title */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
            Reset your password
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Enter your new password below.
          </p>
        </div>

        {apiError && (
          <div role="alert" className="p-3 rounded-xl bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-[#232323] text-[#111111] dark:text-[#FAFAFA] text-xs font-medium text-center">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate autoComplete="off">
          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
              New Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#111111] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength meter */}
            {passwordVal && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  <span>Password strength: <strong className="text-[#111111] dark:text-[#FAFAFA]">{strength.label}</strong></span>
                </div>
                <div className="w-full h-1 bg-[#ECECEC] dark:bg-[#232323] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
              </div>
            )}
            {errors.password && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#111111] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full mt-2 font-medium text-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting...
              </span>
            ) : (
              'Reset Password'
            )}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to login</span>
            </button>
          </div>
        </form>
      </div>
    </AvenAuthLayout>
  );
};

export default AvenResetPasswordPage;
