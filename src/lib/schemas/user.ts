import * as z from "zod";
import { defineEntity, defineField } from "../schema";
import { userServerActions } from "../mock-server-actions";

export const userSchemas = defineEntity({
  name: "User",
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
  fields: {
    id: defineField(z.string())
      .query({ readonly: true })
      .table({
        label: "ID",
        width: "120px",
        sortable: true,
      })
      .build(),

    name: defineField(z.string().min(2))
      .form({
        label: "Full Name",
        placeholder: "Enter your full name",
        inputType: "text",
        required: true,
      })
      .table({
        label: "Full Name",
        width: "200px",
        sortable: true,
      })
      .card({
        label: "Full Name",
        position: "header",
        size: "lg",
        style: "primary",
        showInPreview: true,
        icon: "👤",
      })
      .meta({
        title: "Full Name",
        description: "Enter your full name",
        examples: ["John Doe", "Jane Smith"],
      })
      .build(),

    email: defineField(z.string().email())
      .form({
        label: "Email",
        placeholder: "user@example.com",
        inputType: "email",
        required: true,
      })
      .table({
        label: "Email Address",
        width: "250px",
        sortable: true,
        displayType: "email",
      })
      .card({
        label: "Email",
        position: "body",
        size: "md",
        style: "secondary",
        showInPreview: true,
        icon: "✉️",
      })
      .meta({
        title: "Email Address",
        description: "Your email address",
        examples: ["user@example.com"],
      })
      .build(),

    age: defineField(z.number().int().min(18).max(100))
      .form({
        label: "Age",
        placeholder: "25",
        inputType: "number",
        required: true,
      })
      .table({
        label: "Age",
        width: "80px",
        sortable: true,
        align: "center",
      })
      .card({
        label: "Age",
        position: "footer",
        size: "sm",
        style: "muted",
        showInPreview: true,
        icon: "🎂",
      })
      .meta({
        title: "Age",
        description: "Your age in years",
        examples: [25, 30, 35],
      })
      .build(),

    status: defineField(z.enum(["active", "inactive", "pending"]))
      .form({
        label: "Account Status",
        inputType: "select",
        required: true,
      })
      .table({
        label: "Status",
        width: "120px",
        sortable: true,
        align: "center",
      })
      .card({
        label: "Status",
        position: "header",
        size: "sm",
        style: "accent",
        showInPreview: true,
        icon: "🟢",
      })
      .meta({
        title: "Status",
        description: "Account status",
        examples: ["active"],
      })
      .build(),

    role: defineField(
      z.union([z.literal("admin"), z.literal("user"), z.literal("guest")])
    )
      .form({
        label: "User Role",
        inputType: "select",
        required: true,
      })
      .table({
        label: "Role",
        width: "100px",
        sortable: true,
        align: "center",
      })
      .card({
        label: "Role",
        position: "footer",
        size: "sm",
        style: "secondary",
        showInPreview: true,
        icon: "🔑",
      })
      .meta({
        title: "Role",
        description: "User role",
        examples: ["user"],
      })
      .build(),

    bio: defineField(z.string().min(10).max(500))
      .form({
        label: "Biography",
        placeholder: "Tell us about yourself...",
        inputType: "textarea",
        rows: 4,
        required: true,
      })
      .table({
        label: "Bio",
        width: "300px",
        sortable: false,
      })
      .card({
        label: "Bio",
        position: "body",
        size: "md",
        style: "muted",
        showInPreview: true,
        icon: "📝",
      })
      .meta({
        title: "Biography",
        description: "Tell us about yourself",
        examples: ["I am a software developer with 5 years of experience..."],
      })
      .build(),

    // Conditional field - only show for admin users
    adminNotes: defineField(z.string().optional())
      .form({
        label: "Admin Notes",
        placeholder: "Internal notes for administrators",
        inputType: "textarea",
        rows: 3,
        showWhen: {
          field: "role",
          condition: "equals",
          value: "admin",
        },
      })
      .table({
        label: "Admin Notes",
        width: "200px",
        sortable: false,
        displayType: "text",
        showWhen: {
          field: "role",
          condition: "equals",
          value: "admin",
        },
      })
      .card({
        label: "Admin Notes",
        position: "footer",
        size: "sm",
        style: "muted",
        showInPreview: true,
        icon: "📝",
        showWhen: {
          field: "role",
          condition: "equals",
          value: "admin",
        },
      })
      .build(),

    // Conditional field - only show when status is pending
    pendingReason: defineField(z.string().optional())
      .form({
        label: "Pending Reason",
        placeholder: "Why is this user pending?",
        inputType: "textarea",
        rows: 2,
        showWhen: {
          field: "status",
          condition: "equals",
          value: "pending",
        },
      })
      .table({
        label: "Pending Reason",
        width: "180px",
        sortable: false,
        displayType: "text",
        showWhen: {
          field: "status",
          condition: "equals",
          value: "pending",
        },
      })
      .card({
        label: "Pending Reason",
        position: "footer",
        size: "sm",
        style: "muted",
        showInPreview: true,
        icon: "⏳",
        showWhen: {
          field: "status",
          condition: "equals",
          value: "pending",
        },
      })
      .build(),

    // Conditional field - show contact info for active users with custom logic
    phoneNumber: defineField(z.string().optional())
      .form({
        label: "Phone Number",
        placeholder: "Enter phone number",
        inputType: "text",
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
      .table({
        label: "Phone",
        width: "140px",
        sortable: false,
        displayType: "text",
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
      .card({
        label: "Phone",
        position: "body",
        size: "sm",
        style: "secondary",
        showInPreview: true,
        icon: "📞",
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
      .build(),

    createdAt: defineField(z.date())
      .form({ skip: true })
      .query({ readonly: true })
      .table({
        label: "Created",
        width: "120px",
        sortable: true,
        displayType: "date",
      })
      .build(),

    updatedAt: defineField(z.date())
      .form({ skip: true })
      .query({ readonly: true })
      .table({
        label: "Updated",
        width: "120px",
        sortable: true,
        displayType: "date",
      })
      .build(),
  },
});

export const userSchema = userSchemas.schema;
export const userFormSchema = userSchemas.formSchema;
export const userUpdateSchema = userSchemas.updateSchema;
export const userCardSchema = userSchemas.cardSchema;
