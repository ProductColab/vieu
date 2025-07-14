import * as z from "zod";
import { registerMetadataForSchemas } from "../schema/register-views";
import { userServerActions } from "../mock-server-actions";
import type { FormSections } from "../views/form/form.registry";
import { User, Mail, Settings, FileText } from "lucide-react";

// Regular Zod schema - clean and simple
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
  status: z.enum(["active", "inactive", "pending"]),
  role: z.enum(["admin", "user", "guest"]),
  bio: z.string().optional(),
  adminNotes: z.string().optional(),
  pendingReason: z.string().optional(),
  phoneNumber: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const formSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

type UserValues = z.infer<typeof userSchema>;

// Define form sections
const userFormSections: FormSections = {
  "basic-info": {
    title: "Basic Information",
    description: "Core user details",
    icon: User,
    collapsible: false,
  },
  "contact": {
    title: "Contact Information",
    description: "How to reach the user",
    icon: Mail,
    collapsible: true,
  },
  "account": {
    title: "Account Details",
    description: "User permissions and status",
    icon: Settings,
    collapsible: true,
  },
  "additional": {
    title: "Additional Information",
    description: "Extra details and notes",
    icon: FileText,
    collapsible: true,
  },
};

// Simple metadata object
const userMetadata = {
  id: {
    table: { width: "120px" },
    detail: { section: "Basic Information", layout: "half-width" as const },
  },

  name: {
    input: { placeholder: "Enter your full name" },
    form: { section: "basic-info" },
    table: { width: "200px" },
    card: { position: "header" as const, size: "lg" as const },
    list: { position: "primary" as const },
    detail: { section: "Basic Information", textSize: "2xl" as const },
  },

  email: {
    input: { placeholder: "user@example.com", inputType: "email" as const },
    form: { section: "contact" },
    table: { width: "250px", displayType: "email" as const },
    card: { position: "body" as const, size: "md" as const },
    list: { position: "secondary" as const },
    detail: { section: "Contact Information", textSize: "lg" as const },
  },

  age: {
    input: { placeholder: "25", inputType: "number" as const },
    form: { section: "basic-info" },
    table: { width: "80px", align: "center" as const },
    card: { position: "footer" as const, size: "sm" as const },
    list: { position: "meta" as const },
    detail: { section: "Basic Information", layout: "half-width" as const },
  },

  status: {
    input: { inputType: "select" as const },
    form: { section: "account" },
    table: {
      width: "120px",
      align: "center" as const,
      displayType: "badge" as const,
    },
    card: {
      position: "header" as const,
      size: "sm" as const,
      style: "accent" as const,
    },
    list: { position: "secondary" as const, asBadge: true },
    detail: { section: "Account Details", layout: "third-width" as const },
  },

  role: {
    input: { inputType: "select" as const },
    form: { section: "account" },
    table: {
      width: "100px",
      align: "center" as const,
      displayType: "badge" as const,
    },
    card: { position: "footer" as const, size: "sm" as const },
    list: { position: "secondary" as const, asBadge: true },
    detail: { section: "Account Details", layout: "third-width" as const },
  },

  bio: {
    input: {
      placeholder: "Tell us about yourself...",
      inputType: "textarea" as const,
    },
    form: { section: "additional" },
    table: { width: "300px" },
    card: { position: "body" as const, size: "md" as const },
    list: { position: "secondary" as const, truncate: true },
    detail: { section: "Personal Information", layout: "full-width" as const },
  },

  adminNotes: {
    input: { placeholder: "Internal notes", inputType: "textarea" as const },
    form: { section: "additional" },
    table: { width: "200px" },
    showWhen: {
      field: "role",
      condition: "custom" as const,
      predicate: (_: any, allValues: Record<string, any>) =>
        allValues.role === "admin",
    },
  },

  pendingReason: {
    input: {
      placeholder: "Why is this user pending?",
      inputType: "textarea" as const,
    },
    form: { section: "additional" },
    table: { width: "180px" },
    showWhen: {
      field: "status",
      condition: "custom" as const,
      predicate: (_: any, allValues: Record<string, any>) =>
        allValues.status === "pending",
    },
  },

  phoneNumber: {
    input: { placeholder: "Enter phone number" },
    form: { section: "contact" },
    table: { width: "140px" },
    showWhen: {
      field: "status",
      condition: "custom" as const,
      predicate: (_: any, allValues: Record<string, any>) =>
        allValues.status === "active" && allValues.age >= 21,
    },
  },

  createdAt: {
    table: { width: "120px", displayType: "date" as const },
    detail: { section: "Timestamps", layout: "half-width" as const },
  },

  updatedAt: {
    table: { width: "120px", displayType: "date" as const },
    detail: { section: "Timestamps", layout: "half-width" as const },
  },
};

// Simple validation rules
const userValidation = [
  {
    message: "Admin users must be at least 25 years old",
    path: ["age"] as const,
    validate: (values: UserValues) =>
      values.role === "admin" ? values.age >= 25 : true,
  },
  {
    message: "Pending accounts must have a reason provided",
    path: ["pendingReason"] as const,
    validate: (values: UserValues) =>
      values.status === "pending" ? !!values.pendingReason : true,
  },
  {
    message: "Admin email must be from company domain",
    path: ["email"] as const,
    validate: (values: UserValues) =>
      values.role === "admin" ? values.email.endsWith("@company.com") : true,
  },
];

// Register the metadata with both schemas at once
registerMetadataForSchemas([userSchema, formSchema], userMetadata, {
  label: "user",
  title: "user",
  transport: "server-actions" as const,
  serverActions: userServerActions,
  formSections: userFormSections,
  cacheConfig: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  },
  operations: {
    list: true,
    get: true,
    search: true,
    create: true,
    update: true,
    delete: true,
  },
} as any);

// Export everything
export { userSchema, userMetadata, userValidation, formSchema, userFormSections };
