import { z } from 'zod';

// Form Types
export type FormType = 'tenant' | 'employment' | 'nonprofit';
export type Status = 'cleared' | 'pending' | 'denied';

// Client Information
export interface ClientInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// File Information
export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: Date;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'other';
  fileInfo: FileInfo;
  status: 'uploaded' | 'processing' | 'ready';
}

// Background Check Options by Form Type
export const BACKGROUND_CHECK_OPTIONS = {
  tenant: [
    'Acknowledgement of Background Check',
    'Acknowledgement of Employment',
    'Criminal History Clearance',
    'Reference Check Clearance',
    'Identity Verification',
    'Rental Application Completion',
    'Home Visit Check Completion',
    'Personal Wellness Assessment',
    'Credit Check Assessment',
    'Other',
  ],
  employment: [
    'Acknowledgement of Background Check',
    'Acknowledgement of Employment',
    'Criminal History Clearance',
    'Reference Check Clearance',
    'Identity Verification',
    'Employment Application Completion',
    'Personal Wellness Assessment',
    'Other',
  ],
  nonprofit: [
    'Acknowledgement of Background Check',
    'Acknowledgement of Employment',
    'Criminal History Clearance',
    'Reference Check Clearance',
    'Identity Verification',
    'Sex Offender Clearance',
    'Youth Protection Policy',
    'Illinois State Murderer and Violent Offender Against Youth',
    'Illinois State Police Clearance',
    'FBI Clearance',
    'Other',
  ],
} as const;

// Zod Schemas
export const IdentificationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  streetAddress: z.string().min(1, 'Street address is required'),
  streetAddress2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z
    .string()
    .min(2, 'State is required')
    .max(2, 'State must be 2 characters'),
  postalCode: z.string().min(5, 'Postal code is required'),
  birthdate: z.string().min(1, 'Birthdate is required'),
});

export const FormDataSchema = z.object({
  client: z.string().min(1, 'Client selection is required'),
  formType: z.enum(['tenant', 'employment', 'nonprofit']),
  identification: IdentificationSchema,
  backgroundChecks: z
    .array(z.string())
    .min(1, 'At least one background check must be selected'),
  status: z.enum(['cleared', 'pending', 'denied']),
  memo: z.string().optional(),
  uploadedFile: z
    .object({
      id: z.string(),
      name: z.string(),
      size: z.number(),
      type: z.string(),
      url: z.string().optional(),
      uploadedAt: z.date(),
    })
    .optional(),
});

export type FormData = z.infer<typeof FormDataSchema>;
export type Identification = z.infer<typeof IdentificationSchema>;

// Default Form Data
export const DEFAULT_FORM_DATA: FormData = {
  client: '',
  formType: 'tenant',
  identification: {
    firstName: '',
    lastName: '',
    streetAddress: '',
    streetAddress2: '',
    city: '',
    state: '',
    postalCode: '',
    birthdate: '',
  },
  backgroundChecks: [],
  status: 'pending',
  memo: '',
};

// Sample Clients
export const SAMPLE_CLIENTS: ClientInfo[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(555) 123-4567',
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane.doe@email.com',
    phone: '(555) 987-6543',
  },
  {
    id: '3',
    name: 'Robert Smith',
    email: 'robert.smith@email.com',
    phone: '(555) 456-7890',
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 321-0987',
  },
];

// Form Type Descriptions
export const FORM_TYPE_INFO = {
  tenant: {
    title: 'Tenant Screening',
    description: 'Comprehensive background screening for rental applications',
    requiredChecks: [
      'Acknowledgement of Background Check',
      'Acknowledgement of Employment',
      'Criminal History Clearance',
      'Reference Check Clearance',
      'Identity Verification',
      'Rental Application Completion',
    ],
  },
  employment: {
    title: 'Employment Verification',
    description: 'Professional background verification for employment purposes',
    requiredChecks: [
      'Acknowledgement of Background Check',
      'Acknowledgement of Employment',
      'Criminal History Clearance',
      'Reference Check Clearance',
      'Identity Verification',
      'Employment Application Completion',
    ],
  },
  nonprofit: {
    title: 'Nonprofit Volunteer',
    description: 'Volunteer screening for nonprofit organizations',
    requiredChecks: [
      'Acknowledgement of Background Check',
      'Acknowledgement of Employment',
      'Criminal History Clearance',
      'Reference Check Clearance',
      'Identity Verification',
      'Sex Offender Clearance',
      'Youth Protection Policy',
      'Illinois State Murderer and Violent Offender Against Youth',
      'Illinois State Police Clearance',
    ],
  },
} as const;
