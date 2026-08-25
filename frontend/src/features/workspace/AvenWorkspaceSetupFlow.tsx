import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { authService, type SetupAdminRequest } from '../../services/authService';
import { AvenAuthLayout } from '../auth/AvenAuthLayout';
import { AvenLogo } from '../../components/aven/AvenLogo';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Building2,
  UserCheck,
  Users,
  BarChart3,
  Loader2,
} from 'lucide-react';

// ==========================================
// ZOD SCHEMAS FOR EACH STEP
// ==========================================

const step1Schema = z
  .object({
    adminFullName: z.string().min(2, 'Full Name must be at least 2 characters'),
    adminUsername: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain alphanumeric characters, dots, underscores, and hyphens'),
    adminEmail: z.string().email('Please enter a valid email address'),
    adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
    adminConfirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.adminPassword === data.adminConfirmPassword, {
    message: 'Passwords do not match',
    path: ['adminConfirmPassword'],
  });

const step2Schema = z.object({
  businessName: z.string().min(2, 'Business Name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  businessType: z.string().min(1, 'Please select a business type'),
  phone: z.string().min(8, 'Phone number is required'),
  email: z.string().email('Please enter a valid business email'),
  address: z.string().min(5, 'Address is required'),
  gstNumber: z.string().optional(),
});

const teamMemberSchema = z.object({
  fullName: z.string().min(2, 'Name required'),
  username: z
    .string()
    .min(3, 'Username required')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain alphanumeric characters, dots, underscores, and hyphens'),
  password: z.string().min(6, 'Password min 6 chars'),
  role: z.enum(['MANAGER', 'DELIVERY']),
});

const step3Schema = z.object({
  teamMembers: z.array(teamMemberSchema),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;
type Step3FormData = z.infer<typeof step3Schema>;

export const AvenWorkspaceSetupFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    authService
      .checkSystemStatus()
      .then((status) => {
        if (isMounted && status.adminExists) {
          toast.info('Workspace already initialized', {
            description: 'A primary administrator account already exists. Please log in.',
          });
          navigate('/login', { replace: true });
        }
      })
      .catch(() => {
        // Ignore errors on initial system status check
      });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Step 1 Form
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
    getValues: getValuesStep1,
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      adminFullName: '',
      adminUsername: '',
      adminEmail: '',
      adminPassword: '',
      adminConfirmPassword: '',
    },
  });

  // Step 2 Form
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
    getValues: getValuesStep2,
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      businessName: '',
      industry: '',
      businessType: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: '',
    },
  });

  // Step 3 Form (Team Members)
  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    control: controlStep3,
    getValues: getValuesStep3,
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      teamMembers: [],
    },
  });

  const { fields: teamFields, append: appendTeamMember, remove: removeTeamMember } =
    useFieldArray({
      control: controlStep3,
      name: 'teamMembers',
    });

  // Step 1 Submit -> Advance to Step 2
  const onStep1Submit = (_data: Step1FormData, e?: React.BaseSyntheticEvent) => {
    if (e) e.preventDefault();
    setCurrentStep(2);
  };

  // Step 2 Submit -> Advance to Step 3
  const onStep2Submit = (_data: Step2FormData, e?: React.BaseSyntheticEvent) => {
    if (e) e.preventDefault();
    setCurrentStep(3);
  };

  // Step 3 Submit -> Advance to Step 4 (Review)
  const onStep3Submit = (_data: Step3FormData, e?: React.BaseSyntheticEvent) => {
    if (e) e.preventDefault();
    setCurrentStep(4);
  };

  const handleSkipTeamSetup = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrentStep(4);
  };

  // Final Setup Completion (Step 4 -> Step 5)
  const handleCompleteSetup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      const step1Data = getValuesStep1();
      const step2Data = getValuesStep2();
      const step3Data = getValuesStep3();

      const validTeamMembers = (step3Data.teamMembers || []).filter(
        (m) => m.fullName?.trim() && m.username?.trim() && m.password?.trim()
      );

      const setupPayload: SetupAdminRequest = {
        adminFullName: step1Data.adminFullName,
        adminUsername: step1Data.adminUsername,
        adminEmail: step1Data.adminEmail,
        adminPassword: step1Data.adminPassword,
        adminPhone: step2Data.phone,

        businessName: step2Data.businessName,
        industry: step2Data.industry,
        businessType: step2Data.businessType,
        phone: step2Data.phone,
        email: step2Data.email,
        address: step2Data.address,
        gstNumber: step2Data.gstNumber,

        teamMembers: validTeamMembers,
      };

      await authService.setupFirstAdmin(setupPayload);

      toast.success('Workspace Created Successfully!', {
        description: 'Your Aven workspace and administrator account have been initialized.',
      });

      setCurrentStep(5);
    } catch (error) {
      let errorMsg = 'Failed to create workspace. Please check your inputs and try again.';
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          toast.error('Workspace Already Initialized', {
            description: 'Workspace setup has already been completed. Redirecting to login...',
          });
          setTimeout(() => navigate('/login', { replace: true }), 1500);
          return;
        }
        if (error.response?.data?.validationErrors && Object.keys(error.response.data.validationErrors).length > 0) {
          errorMsg = Object.entries(error.response.data.validationErrors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('; ');
        } else if (error.response?.data?.message) {
          errorMsg = error.response.data.message;
        }
      }
      toast.error('Setup Failed', {
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const step1Values = getValuesStep1();
  const step2Values = getValuesStep2();
  const step3Values = getValuesStep3();

  return (
    <AvenAuthLayout maxWidth="lg">
      <div className="space-y-6 sm:space-y-8">
        {/* Single Brand Logo */}
        <AvenLogo size="lg" align="center" />

        {/* STEP 1: ADMINISTRATOR SETUP */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-6 max-w-md mx-auto"
          >
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
                Create admin account
              </h1>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                You'll be the primary administrator of this workspace.
              </p>
            </div>

            <form onSubmit={handleSubmitStep1(onStep1Submit)} className="space-y-4" noValidate autoComplete="off">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                  Full Name
                </label>
                <Input
                  {...registerStep1('adminFullName')}
                  placeholder="Enter your full name"
                  autoComplete="off"
                  autoFocus
                />
                {errorsStep1.adminFullName && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    {errorsStep1.adminFullName.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                  Username
                </label>
                <Input
                  {...registerStep1('adminUsername')}
                  placeholder="Enter your admin username"
                  autoComplete="off"
                />
                {errorsStep1.adminUsername && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    {errorsStep1.adminUsername.message}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                  Email Address
                </label>
                <Input
                  type="email"
                  {...registerStep1('adminEmail')}
                  placeholder="Enter your email address"
                  autoComplete="off"
                />
                {errorsStep1.adminEmail && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    {errorsStep1.adminEmail.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showAdminPassword ? 'text' : 'password'}
                    {...registerStep1('adminPassword')}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#111111] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errorsStep1.adminPassword && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    {errorsStep1.adminPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showAdminConfirmPassword ? 'text' : 'password'}
                    {...registerStep1('adminConfirmPassword')}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#111111] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showAdminConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errorsStep1.adminConfirmPassword && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    {errorsStep1.adminConfirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Step 1 */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4 font-medium text-sm"
              >
                Continue
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
          </motion.div>
        )}

        {/* STEP 2: BUSINESS INFORMATION */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-6 max-w-md mx-auto"
          >
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
                Tell us about your business
              </h1>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                This information helps us personalize your experience.
              </p>
            </div>

            <form onSubmit={handleSubmitStep2(onStep2Submit)} className="space-y-4" noValidate autoComplete="off">
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                  Business Name
                </label>
                <Input
                  {...registerStep2('businessName')}
                  placeholder="Enter business name"
                  autoComplete="off"
                  autoFocus
                />
                {errorsStep2.businessName && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    {errorsStep2.businessName.message}
                  </p>
                )}
              </div>

              {/* Industry & Business Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                    Industry
                  </label>
                  <select
                    {...registerStep2('industry')}
                    className="flex h-12 w-full rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] px-4 py-2 text-sm text-[#111111] dark:text-[#FAFAFA] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] dark:focus-visible:ring-[#FAFAFA]"
                  >
                    <option value="">Select Industry</option>
                    <option value="Retail & Distribution">Retail & Distribution</option>
                    <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                    <option value="Services & Wholesale">Services & Wholesale</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                    Business Type
                  </label>
                  <select
                    {...registerStep2('businessType')}
                    className="flex h-12 w-full rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] px-4 py-2 text-sm text-[#111111] dark:text-[#FAFAFA] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] dark:focus-visible:ring-[#FAFAFA]"
                  >
                    <option value="">Select Business Type</option>
                    <option value="Corporation / LLC">Corporation / LLC</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>
              </div>

              {/* Phone & Business Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                    Phone Number
                  </label>
                  <Input {...registerStep2('phone')} placeholder="Enter 10-digit phone number" autoComplete="off" />
                  {errorsStep2.phone && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                      {errorsStep2.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                    Business Email
                  </label>
                  <Input {...registerStep2('email')} placeholder="Enter business email address" autoComplete="off" />
                  {errorsStep2.email && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                      {errorsStep2.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                  Address
                </label>
                <Input {...registerStep2('address')} placeholder="Enter business headquarters address" autoComplete="off" />
                {errorsStep2.address && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    {errorsStep2.address.message}
                  </p>
                )}
              </div>

              {/* GST Number (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#111111] dark:text-[#FAFAFA] block">
                  GST Identification Number <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(Optional)</span>
                </label>
                <Input {...registerStep2('gstNumber')} placeholder="Enter GSTIN (optional)" autoComplete="off" />
              </div>

              {/* Buttons */}
              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-medium text-sm"
                >
                  Continue
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* STEP 3: INITIAL TEAM SETUP (OPTIONAL) */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-6 max-w-md mx-auto"
          >
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
                Add your first team members
              </h1>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                You can always invite more people later.
              </p>
            </div>

            <form onSubmit={handleSubmitStep3(onStep3Submit)} className="space-y-4" noValidate autoComplete="off">
              <div className="space-y-3">
                {teamFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-3 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">
                        Team Member #{index + 1}
                      </span>
                      {teamFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          className="text-neutral-400 hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Input
                        {...registerStep3(`teamMembers.${index}.fullName` as const)}
                        placeholder="Full Name"
                        autoComplete="off"
                        className="h-10 text-xs"
                      />
                      <Input
                        {...registerStep3(`teamMembers.${index}.username` as const)}
                        placeholder="Username"
                        autoComplete="off"
                        className="h-10 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Input
                        type="password"
                        {...registerStep3(`teamMembers.${index}.password` as const)}
                        placeholder="Password"
                        autoComplete="new-password"
                        className="h-10 text-xs"
                      />
                      <select
                        {...registerStep3(`teamMembers.${index}.role` as const)}
                        className="flex h-10 w-full rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] px-3 py-1 text-xs text-[#111111] dark:text-[#FAFAFA]"
                      >
                        <option value="MANAGER">Sales Representative</option>
                        <option value="DELIVERY">Delivery Staff</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Member Button */}
              <button
                type="button"
                onClick={() =>
                  appendTeamMember({
                    fullName: '',
                    username: '',
                    password: '',
                    role: 'DELIVERY',
                  })
                }
                className="w-full h-11 border border-dashed border-[#ECECEC] dark:border-[#232323] rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] hover:border-[#111111] dark:hover:border-[#FAFAFA] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Member</span>
              </button>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full font-medium text-sm"
                >
                  Continue
                </Button>

                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipTeamSetup}
                    className="text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors font-medium cursor-pointer"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* STEP 4: REVIEW & COMPLETE */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="space-y-6 max-w-md mx-auto"
          >
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
                Review your setup
              </h1>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Please review your information before we set up your workspace.
              </p>
            </div>

            <form onSubmit={handleCompleteSetup} className="space-y-6" noValidate autoComplete="off">
              <div className="space-y-3 text-xs">
                {/* Workspace Details Card */}
                <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#111111] dark:text-[#FAFAFA] border-b border-[#ECECEC] dark:border-[#232323] pb-2">
                    <Building2 className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                    <span>Business & Workspace</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[#71717A] dark:text-[#A1A1AA] pt-1">
                    <span>Workspace Name:</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{step2Values.businessName || '—'}</span>
                    <span>Workspace URL:</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">
                      {step2Values.businessName
                        ? `${step2Values.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.aven.app`
                        : 'workspace.aven.app'}
                    </span>
                    <span>Industry:</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{step2Values.industry || '—'}</span>
                  </div>
                </div>

                {/* Administrator Details Card */}
                <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#111111] dark:text-[#FAFAFA] border-b border-[#ECECEC] dark:border-[#232323] pb-2">
                    <UserCheck className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                    <span>Administrator Account</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[#71717A] dark:text-[#A1A1AA] pt-1">
                    <span>Primary Admin:</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{step1Values.adminFullName || '—'}</span>
                    <span>Username:</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{step1Values.adminUsername || '—'}</span>
                    <span>Email:</span>
                    <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{step1Values.adminEmail || '—'}</span>
                  </div>
                </div>

                {/* Initial Team Card */}
                <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#111111] dark:text-[#FAFAFA] border-b border-[#ECECEC] dark:border-[#232323] pb-2">
                    <Users className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                    <span>Initial Team Members</span>
                  </div>
                  <div className="text-[#71717A] dark:text-[#A1A1AA] pt-1 space-y-1">
                    {step3Values.teamMembers.length > 0 ? (
                      step3Values.teamMembers.map((m, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="font-medium text-[#111111] dark:text-[#FAFAFA]">{m.fullName || m.username}</span>
                          <span className="uppercase text-[10px] bg-neutral-100 dark:bg-neutral-800 text-[#111111] dark:text-[#FAFAFA] px-1.5 py-0.5 rounded">
                            {m.role}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px]">No team members added yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Setup Button */}
              <div className="pt-2 space-y-3">
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
                      Initializing Workspace...
                    </span>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentStep(3);
                    }}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* STEP 5: WORKSPACE CREATED SUCCESSFUL */}
        {currentStep === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 max-w-md mx-auto text-center py-4"
          >
            {/* Checkmark Icon Circle */}
            <div className="mx-auto w-16 h-16 rounded-full border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] flex items-center justify-center text-[#111111] dark:text-[#FAFAFA]">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            {/* Heading & Subtitle */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#FAFAFA]">
                You're all set!
              </h1>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Your workspace is ready. Let's get you started.
              </p>
            </div>

            {/* Overview Highlights */}
            <div className="p-4 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-left space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#111111] dark:text-[#FAFAFA] block">Manage your business in one place</span>
                  <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Orders, inventory, deliveries, and verified reporting.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#111111] dark:text-[#FAFAFA] block">Invite your team and collaborate</span>
                  <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Role-based access control for Sales Representatives and Delivery staff.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart3 className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-[#111111] dark:text-[#FAFAFA] block">Track your growth with clarity</span>
                  <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">Real-time operational financial summaries and metrics.</span>
                </div>
              </div>
            </div>

            {/* Go to Login Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full font-medium text-sm"
            >
              Go to Login
            </Button>
          </motion.div>
        )}
      </div>
    </AvenAuthLayout>
  );
};

export default AvenWorkspaceSetupFlow;
