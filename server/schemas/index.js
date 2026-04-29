const { z } = require('zod');

// Authentication Schemas
const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    role: z.enum(['Admin', 'Engineer'], {
      errorMap: () => ({ message: "Role must be either 'Admin' or 'Engineer'" }),
    }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    identifier: z.string({ required_error: 'Email or Phone is required' }),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
});

// Report Schemas
const createReportSchema = z.object({
  body: z.object({
    site: z.string({ required_error: 'Site ID is required' }),
    title: z
      .string({ required_error: 'Report title is required' })
      .min(3, 'Title must be at least 3 characters'),
    materialTested: z.string({ required_error: 'Material tested is required' }),
    testResult: z.string({ required_error: 'Test result is required' }),
    comments: z.string().optional(),
    image: z.string().optional(), // assuming image is handled separately by multer or base64
  }),
});

const updateReportStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Approved', 'Rejected'], {
      errorMap: () => ({ message: "Status must be either 'Approved' or 'Rejected'" }),
    }),
    reviewComment: z.string().optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Report ID parameter is required' }),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().optional(),
  }),
  params: z.object({
    token: z.string({ required_error: 'Reset token is required' }),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  createReportSchema,
  updateReportStatusSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
