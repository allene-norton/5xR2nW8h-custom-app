import { z } from 'zod';

// Form Types
export type FormType = 'tenant' | 'employment' | 'nonprofit' | 'consulting';
export type Status = 'cleared' | 'pending' | 'denied';

// Background Check Options by Form Type
export const BACKGROUND_CHECK_OPTIONS = {
  tenant: [
    'Criminal History Clearance',
    'Credit Check Assessment',
    'Chicago Police Clearance',
  ],
  employment: [
    'Criminal History Clearance',
    'Personal Wellness Assessment',
    'Chicago Police Clearance',
    'FBI Clearance',
  ],
  nonprofit: [
    'Criminal History Clearance',
    'Illinois Sex Offender Clearance',
    'Illinois State Murderer and Violent Offender Against Youth',
    'Chicago Police Clearance',
    'FBI Clearance',
  ],
    consulting: [],
} as const;

// Per-check result options. Selecting one of these populates the result
// directly into the report so it never has to be typed in by hand.
export const CHECK_RESULT_OPTIONS = [
  'No Records Found',
  'Cleared',
  'Records Found',
  'Under Review',
  'Pending',
  'Not Applicable',
] as const;

export type CheckResult = (typeof CHECK_RESULT_OPTIONS)[number];

export const DEFAULT_CHECK_RESULT: CheckResult = 'Pending';

// Check names that were stored under an earlier spelling. Saved records are
// normalized through this on load so a renamed check keeps its result and file
// instead of being treated as a new custom check.
export const LEGACY_CHECK_NAME_MAP: Record<string, string> = {
  'Crimnal History Clearance': 'Criminal History Clearance',
  'Credit Check Assesment': 'Credit Check Assessment',
  'Personal Wellness Assesment': 'Personal Wellness Assessment',
};

export function normalizeCheckName(checkName: string): string {
  return LEGACY_CHECK_NAME_MAP[checkName] ?? checkName;
}

// Zod Schemas

export const BackgroundCheckFilesSchema = z.array(
  z.object({
    checkName: z.string(),
    fileUploaded: z.boolean(),
    fileName: z.string().optional(),
    fileId: z.string().optional(),
    // Optional so records saved before results existed still validate.
    result: z.enum(CHECK_RESULT_OPTIONS).optional(),
  }),
);

export const IdentificationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  streetAddress: z.string().optional(), // example.min(1, 'Street address is required'),
  streetAddress2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  birthdate: z.string().optional(),
});

export const FormDataSchema = z.object({
  client: z.string().min(1, 'Client selection is required'),
  formType: z.enum(['tenant', 'employment', 'nonprofit', 'consulting']),
  identification: IdentificationSchema,
  backgroundChecks: z.array(z.string()),
  backgroundCheckFiles: BackgroundCheckFilesSchema,
  status: z.enum(['cleared', 'pending', 'denied']),
  memo: z.string().optional(),
  fileChannelId: z.string().optional(),
  folderCreated: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.formType !== 'consulting' && data.backgroundChecks.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: 'array',
      inclusive: true,
      message: 'At least one background check must be selected',
      path: ['backgroundChecks'],
    });
  }
});

export type BackgroundCheckFormData = z.infer<typeof FormDataSchema>;
export type Identification = z.infer<typeof IdentificationSchema>;
export type BackgroundCheckFiles = z.infer<typeof BackgroundCheckFilesSchema>;
export type BackgroundCheckFile = z.infer<
  typeof BackgroundCheckFilesSchema
>[number];

// Default Form Data
export const DEFAULT_FORM_DATA: BackgroundCheckFormData = {
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
  backgroundCheckFiles: [],
  status: 'pending',
  memo: '',
  fileChannelId: '',
  folderCreated: false,
};

// Form Type Descriptions
export const FORM_TYPE_INFO = {
  tenant: {
    title: 'Tenant Screening',
    description: 'Comprehensive background screening for rental applications.',
    requiredChecks: [
      'Criminal History Clearance',
      'Credit Check Assessment',
      'Chicago Police Clearance',
    ],
  },
  employment: {
    title: 'Employment Screening',
    description: 'Professional background verification for employment purposes.',
    requiredChecks: [
      'Criminal History Clearance',
      'Personal Wellness Assessment',
      'Chicago Police Clearance',
      'FBI Clearance',
    ],
  },
  nonprofit: {
    title: 'Nonprofit Screening',
    description: 'Volunteer screening for nonprofit organizations.',
    requiredChecks: [
      'Criminal History Clearance',
      'Illinois Sex Offender Clearance',
      'Illinois State Murderer and Violent Offender Against Youth',
      'Chicago Police Clearance'
    ],
  },
  consulting: {
    title: 'Consulting Screening',
    description: 'Background screening for independent consultants and contract-based engagements.',
    requiredChecks: [
    ],
  },
} as const;
