import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AvenAuthLayout } from './AvenAuthLayout';
import { AvenLogo } from '../../components/aven/AvenLogo';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export const AvenForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);

    toast.success('Reset Link Sent', {
      description: `If an account exists for ${data.email}, instructions have been sent.`,
    });

    navigate('/reset-password');
  };

  return (
    <AvenAuthLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Single Brand Logo */}
        <AvenLogo size="lg" align="center" />

        {/* Section Title */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
            Forgot your password?
          </h1>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-xs mx-auto">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5" noValidate autoComplete="off">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter your email address"
              autoComplete="off"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full font-medium text-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Reset Link'
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

export default AvenForgotPasswordPage;
