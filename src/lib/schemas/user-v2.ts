import * as z from "zod";
import {
  defineSmartField,
  semanticFields,
} from "../schema/field-definition-v2";
import { createSmartEntity } from "../schema/smart-field-adapter";
import { userServerActions } from "../mock-server-actions";

// Define fields using the new smart field approach
const userFields = {
  id: defineSmartField(z.string(), "id")
    .base({ readonly: true, priority: "low" })
    .input({ skip: true })
    .list({ width: "120px" })
    .detail({
      section: "Basic Information",
      layout: "half-width",
      textSize: "sm",
    })
    .build(),

  name: semanticFields
    .personName()
    .input({ placeholder: "Enter your full name" })
    .table({ width: "200px" })
    .card({ position: "header", size: "lg", showInPreview: true })
    .list({ position: "primary" })
    .detail({
      section: "Basic Information",
      presentation: "highlighted",
      textSize: "2xl",
    })
    .build(),

  email: semanticFields
    .email()
    .input({ placeholder: "user@example.com" })
    .table({ width: "250px", displayType: "email" })
    .card({
      position: "body",
      size: "md",
      style: "secondary",
      showInPreview: true,
    })
    .list({ position: "secondary" })
    .detail({ section: "Contact Information", textSize: "lg" })
    .build(),

  age: semanticFields
    .age()
    .input({ placeholder: "25" })
    .table({ width: "80px", align: "center" })
    .card({
      position: "footer",
      size: "sm",
      style: "muted",
      showInPreview: true,
    })
    .list({ position: "meta" })
    .detail({ section: "Basic Information", layout: "half-width" })
    .build(),

  status: semanticFields
    .status(["active", "inactive", "pending"] as const)
    .table({ width: "120px", align: "center" })
    .card({
      position: "header",
      size: "sm",
      style: "accent",
      showInPreview: true,
    })
    .list({ position: "secondary", asBadge: true })
    .detail({
      section: "Account Details",
      layout: "third-width",
      presentation: "bordered",
    })
    .build(),

  role: semanticFields
    .role(["admin", "user", "guest"] as const)
    .table({ width: "100px", align: "center" })
    .card({
      position: "footer",
      size: "sm",
      style: "secondary",
      showInPreview: true,
    })
    .list({ position: "secondary", asBadge: true, badgeVariant: "secondary" })
    .detail({
      section: "Account Details",
      layout: "third-width",
      presentation: "bordered",
    })
    .build(),

  bio: semanticFields
    .bio()
    .input({ placeholder: "Tell us about yourself..." })
    .table({ width: "300px" })
    .card({ position: "body", size: "md", style: "muted", showInPreview: true })
    .list({ position: "secondary", truncate: true })
    .detail({
      section: "Personal Information",
      layout: "full-width",
      presentation: "card",
    })
    .build(),

  // Conditional fields
  adminNotes: defineSmartField(z.string().optional(), "adminNotes")
    .base({
      label: "Admin Notes",
      icon: "📝",
      showWhen: { field: "role", condition: "equals", value: "admin" },
    })
    .input({
      placeholder: "Internal notes for administrators",
      inputType: "textarea",
      rows: 3,
    })
    .table({ width: "200px" })
    .card({
      position: "footer",
      size: "sm",
      style: "muted",
      showInPreview: true,
    })
    .list({ position: "meta", truncate: true })
    .detail({
      section: "Administrative",
      layout: "full-width",
      presentation: "bordered",
    })
    .build(),

  pendingReason: defineSmartField(z.string().optional(), "pendingReason")
    .base({
      label: "Pending Reason",
      icon: "⏳",
      showWhen: { field: "status", condition: "equals", value: "pending" },
    })
    .input({
      placeholder: "Why is this user pending?",
      inputType: "textarea",
      rows: 2,
    })
    .table({ width: "180px" })
    .card({
      position: "footer",
      size: "sm",
      style: "muted",
      showInPreview: true,
    })
    .list({ position: "meta", truncate: true })
    .detail({
      section: "Account Details",
      layout: "full-width",
      presentation: "bordered",
    })
    .build(),

  phoneNumber: defineSmartField(z.string().optional(), "phoneNumber")
    .base({
      label: "Phone Number",
      icon: "📞",
      clickable: true,
      showWhen: {
        field: "status",
        condition: "custom",
        predicate: (statusValue, allValues) => {
          return (
            statusValue === "active" &&
            allValues.age &&
            Number(allValues.age) >= 21
          );
        },
      },
    })
    .input({ placeholder: "Enter phone number" })
    .table({ width: "140px" })
    .card({
      position: "body",
      size: "sm",
      style: "secondary",
      showInPreview: true,
    })
    .list({ position: "secondary" })
    .detail({
      section: "Contact Information",
      layout: "half-width",
      textSize: "lg",
    })
    .build(),

  createdAt: semanticFields
    .createdAt()
    .table({ width: "120px", displayType: "date" })
    .list({ position: "meta" })
    .detail({ section: "Timestamps", layout: "half-width", textSize: "sm" })
    .build(),

  updatedAt: semanticFields
    .updatedAt()
    .table({ width: "120px", displayType: "date" })
    .list({ position: "meta" })
    .detail({ section: "Timestamps", layout: "half-width", textSize: "sm" })
    .build(),
};

// Create the entity using the smart field adapter
export const userSchemasV2 = createSmartEntity({
  name: "User",
  fields: userFields,
  transport: "server-actions",
  serverActions: userServerActions,
  cacheConfig: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  // Cross-field validation rules
  validation: [
    {
      message: "Admin users must be at least 25 years old",
      path: ["age"],
      validate: (values) => {
        if (values.role === "admin") {
          return values.age >= 25;
        }
        return true;
      },
    },
    {
      message: "Pending accounts must have a reason provided",
      path: ["pendingReason"],
      validate: (values) => {
        if (values.status === "pending") {
          return values.pendingReason && values.pendingReason.length > 0;
        }
        return true;
      },
    },
    {
      message: "Admin email must be from company domain",
      path: ["email"],
      validate: (values) => {
        if (values.role === "admin") {
          return values.email && values.email.endsWith("@company.com");
        }
        return true;
      },
    },
  ],
});

// Export the schemas for use in components
export const userSchemaV2 = userSchemasV2.schema;
export const userFormSchemaV2 = userSchemasV2.formSchema;
export const userUpdateSchemaV2 = userSchemasV2.updateSchema;
export const userCardSchemaV2 = userSchemasV2.cardSchema;
export const userListSchemaV2 = userSchemasV2.listSchema;
export const userDetailSchemaV2 = userSchemasV2.detailSchema;
