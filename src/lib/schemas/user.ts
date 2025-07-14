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
      .list({
        label: "ID",
        position: "meta",
        truncate: true,
      })
      .detail({
        label: "ID",
        section: "Basic Information",
        priority: "low",
        layout: "half-width",
        textSize: "sm",
        showInDetail: true,
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
      .list({
        label: "Full Name",
        position: "primary",
        icon: "👤",
        clickable: true,
      })
      .detail({
        label: "Full Name",
        section: "Basic Information",
        priority: "high",
        layout: "full-width",
        presentation: "highlighted",
        textSize: "2xl",
        icon: "👤",
        showInDetail: true,
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
      .list({
        label: "Email",
        position: "secondary",
        icon: "✉️",
        clickable: true,
      })
      .detail({
        label: "Email Address",
        section: "Contact Information",
        priority: "high",
        layout: "half-width",
        textSize: "lg",
        icon: "✉️",
        clickable: true,
        showInDetail: true,
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
      .list({
        label: "Age",
        position: "meta",
        icon: "🎂",
      })
      .detail({
        label: "Age",
        section: "Basic Information",
        priority: "medium",
        layout: "half-width",
        textSize: "base",
        icon: "🎂",
        showInDetail: true,
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
      .list({
        label: "Status",
        position: "secondary",
        asBadge: true,
        badgeVariant: "default",
        icon: "🟢",
      })
      .detail({
        label: "Account Status",
        section: "Account Details",
        priority: "high",
        layout: "third-width",
        presentation: "bordered",
        asBadge: true,
        badgeVariant: "default",
        icon: "🟢",
        showInDetail: true,
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
      .list({
        label: "Role",
        position: "secondary",
        asBadge: true,
        badgeVariant: "secondary",
        icon: "🔑",
      })
      .detail({
        label: "User Role",
        section: "Account Details",
        priority: "high",
        layout: "third-width",
        presentation: "bordered",
        asBadge: true,
        badgeVariant: "secondary",
        icon: "🔑",
        showInDetail: true,
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
      .list({
        label: "Bio",
        position: "secondary",
        icon: "📝",
        truncate: true,
      })
      .detail({
        label: "Biography",
        section: "Personal Information",
        priority: "medium",
        layout: "full-width",
        presentation: "card",
        textSize: "base",
        icon: "📝",
        showInDetail: true,
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
      .list({
        label: "Admin Notes",
        position: "meta",
        icon: "📝",
        truncate: true,
        showWhen: {
          field: "role",
          condition: "equals",
          value: "admin",
        },
      })
      .detail({
        label: "Admin Notes",
        section: "Administrative",
        priority: "medium",
        layout: "full-width",
        presentation: "bordered",
        textSize: "sm",
        icon: "📝",
        showInDetail: true,
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
      .list({
        label: "Pending Reason",
        position: "meta",
        icon: "⏳",
        truncate: true,
        showWhen: {
          field: "status",
          condition: "equals",
          value: "pending",
        },
      })
      .detail({
        label: "Pending Reason",
        section: "Account Details",
        priority: "high",
        layout: "full-width",
        presentation: "bordered",
        textSize: "base",
        icon: "⏳",
        showInDetail: true,
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
      .list({
        label: "Phone",
        position: "secondary",
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
      .detail({
        label: "Phone Number",
        section: "Contact Information",
        priority: "high",
        layout: "half-width",
        textSize: "lg",
        icon: "📞",
        clickable: true,
        showInDetail: true,
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
      .list({
        label: "Created",
        position: "meta",
      })
      .detail({
        label: "Created",
        section: "Timestamps",
        priority: "low",
        layout: "half-width",
        textSize: "sm",
        showInDetail: true,
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
      .list({
        label: "Updated",
        position: "meta",
      })
      .detail({
        label: "Updated",
        section: "Timestamps",
        priority: "low",
        layout: "half-width",
        textSize: "sm",
        showInDetail: true,
      })
      .build(),
  },
});

export const userSchema = userSchemas.schema;
export const userFormSchema = userSchemas.formSchema;
export const userUpdateSchema = userSchemas.updateSchema;
export const userCardSchema = userSchemas.cardSchema;
export const userListSchema = userSchemas.listSchema;
export const userDetailSchema = userSchemas.detailSchema;
