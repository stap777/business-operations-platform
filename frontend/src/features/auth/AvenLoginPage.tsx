import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AvenAuthLayout } from './AvenAuthLayout';
import { AvenLogo } from '../../components/aven/AvenLogo';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const AvenLoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login, getRoleRedirectPath } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.login({
        username: data.username.trim(),
        password: data.password,
      });

      login(response);

      toast.success(`Welcome back, ${response.fullName || response.username}!`, {
        description: `Signed in to workspace`,
      });

      const redirectPath = getRoleRedirectPath(response.role);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      let errorMsg = 'Invalid username or password.';
      if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (!err.response) {
        errorMsg = 'Unable to connect to Aven. Please try again.';
      }
      setApiError(errorMsg);
      toast.error('Authentication Error', { description: errorMsg });
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
            Welcome back.
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
            Sign in to continue to your workspace.
          </p>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              role="alert"
              className="p-3 rounded-xl bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-[#232323] text-[#111111] dark:text-[#FAFAFA] text-xs font-medium text-center"
            >
              {apiError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate autoComplete="off">
          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block"
            >
              Username
            </label>
            <Input
              id="username"
              {...register('username')}
              placeholder="Enter your username"
              disabled={isSubmitting}
              autoComplete="off"
            />
            {errors.username && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <Input
                id="password"
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                disabled={isSubmitting}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#111111] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA] transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#71717A] dark:text-[#A1A1AA] cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('rememberMe')}
                disabled={isSubmitting}
                className="w-4 h-4 rounded border-[#ECECEC] dark:border-[#232323] accent-[#111111] dark:accent-[#FAFAFA] bg-white dark:bg-[#0F0F0F]"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Primary Button */}
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
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ECECEC] dark:border-[#232323]" />
            </div>
            <span className="relative bg-[#FAFAFA] dark:bg-[#000000] px-2 text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
              or
            </span>
          </div>

          {/* Secondary Action: Create Workspace */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/workspace-setup')}
            className="w-full font-medium text-sm"
          >
            Create Workspace
          </Button>
        </form>
      </div>
    </AvenAuthLayout>
  );
};

export default AvenLoginPage;
