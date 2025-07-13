# vieu Developer Documentation

## Overview

vieu is a **schema-driven UI generation system** that eliminates UI boilerplate by using Zod schemas as the single source of truth for forms, tables, cards, and other view types. Define your data model once, register view-specific metadata, and generate type-safe, validated UIs automatically.

## Core Architecture

### Schema-Registry Pattern

The system uses a **dual-layer architecture**:

1. **Schema Layer**: Pure Zod schemas defining data structure and validation
2. **Registry Layer**: View-specific metadata registered against schema fields

```typescript
// 1. Define schema with validation
const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

// 2. Register view-specific metadata
email.register(formRegistry, {
  label: "Email Address",
  placeholder: "user@example.com",
  inputType: "email"
});

// 3. Generate UI components
<SchemaForm schema={userSchema} onSubmit={handleSubmit} />
<SchemaTable schema={userSchema} data={users} />
```

### Key Components

#### Schema Builder System (`src/lib/schema/schema.builder.ts`)

**Purpose**: Declarative schema definition with view metadata
**API**: `defineEntity()` and `defineField()`

```typescript
export const userSchemas = defineEntity({
  name: "User",
  transport: "server-actions",
  serverActions: userServerActions,
  fields: {
    email: defineField(z.string().email())
      .form({
        label: "Email",
        placeholder: "user@example.com",
        inputType: "email",
      })
      .table({
        label: "Email Address",
        width: "250px",
        sortable: true,
      })
      .card({
        label: "Email",
        position: "body",
        showInPreview: true,
      })
      .build(),
  },
});
```

#### Registry System (`src/lib/schema/base.registry.ts`)

**Purpose**: Associates metadata with schema fields
**Key Functions**:

- `createViewRegistry()`: Creates a complete registry for a view type
- `createComponentDispatcher()`: Routes fields to appropriate components
- `getGenericInputType()`: Infers input types from schema structure

```typescript
// Each view type has its own registry
export const formRegistry = createViewRegistry(
  formComponentMap, // Input -> React component
  getFormComponentType, // Schema -> component type
  buildFormProps // Schema + metadata -> props
);
```

#### View Components (`src/lib/views/`)

**Purpose**: Render UI components based on schema + metadata
**Structure**:

- `form/`: Form inputs with validation
- `table/`: Sortable data tables
- `card/`: Card-based layouts

```typescript
// Generic components that work with any schema
<SchemaForm schema={userSchema} onSubmit={handleSubmit} />
<SchemaTable schema={userSchema} data={users} onSort={handleSort} />
<SchemaCardGrid schema={userSchema} data={users} />
```

#### Query System (`src/lib/query/`)

**Purpose**: Data fetching and mutations with React Query
**Key Features**:

- Auto-generated CRUD operations
- Optimistic updates
- Server action support
- Type-safe entity operations

```typescript
const { useList, useCreate, useUpdate } = useEntity(userSchema);
const { data: users } = useList();
const createUser = useCreate();
```

## Key Concepts

### 1. Field Metadata Registration

Each field can register different metadata for different view types:

```typescript
defineField(z.string().email())
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
    showInPreview: true,
    icon: "✉️",
  })
  .query({
    readonly: false,
  })
  .build();
```

### 2. Conditional Logic

Fields can show/hide based on other field values:

```typescript
// Simple condition
phoneNumber: defineField(z.string().optional()).form({
  label: "Phone Number",
  showWhen: {
    field: "status",
    condition: "equals",
    value: "active",
  },
});

// Complex condition with custom predicate
phoneNumber: defineField(z.string().optional()).form({
  label: "Phone Number",
  showWhen: {
    field: "status",
    condition: "custom",
    predicate: (statusValue, allValues) => {
      return statusValue === "active" && allValues.age >= 21;
    },
  },
});
```

### 3. Cross-Field Validation

Validate relationships between fields:

```typescript
defineEntity({
  name: "User",
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
  ],
  fields: {
    /* ... */
  },
});
```

### 4. Type Inference

The system automatically infers appropriate input types:

```typescript
// Automatic type inference
z.string().email(); // → email input
z.number(); // → number input
z.enum(["a", "b"]); // → select dropdown
z.boolean(); // → checkbox
z.string().describe("Long text"); // → textarea (with hint)
```

### 5. Schema Variants

Each entity generates multiple schema variants:

```typescript
const userSchemas = defineEntity({...});

// Generated schemas
userSchemas.schema        // Full entity schema
userSchemas.formSchema    // Form fields only (excludes readonly)
userSchemas.updateSchema  // All fields optional
userSchemas.cardSchema    // Same as entity schema
```

## API Reference

### Core Functions

#### `defineEntity(config)`

Creates an entity with all view schemas and metadata.

```typescript
interface EntityConfig {
  name: string;
  fields: Record<string, FieldConfig>;
  transport?: "rest" | "server-actions";
  serverActions?: ServerActionFunctions;
  cacheConfig?: CacheConfig;
  validation?: CrossFieldValidation[];
}
```

#### `defineField(zodSchema)`

Creates a field builder for associating metadata with a Zod schema.

```typescript
defineField(z.string().email())
  .form({ label: "Email", inputType: "email" })
  .table({ label: "Email", sortable: true })
  .card({ label: "Email", position: "body" })
  .build();
```

#### `useEntity(schema)`

Generates complete CRUD operations for an entity.

```typescript
const {
  useList, // Query list of entities
  useGet, // Query single entity
  useSearch, // Search entities
  useCreate, // Create mutation
  useUpdate, // Update mutation
  useDelete, // Delete mutation
} = useEntity(userSchema);
```

### View Components

#### `SchemaForm`

Renders a form with validation from a schema.

```typescript
<SchemaForm
  schema={userFormSchema}
  onSubmit={(data) => console.log(data)}
  className="custom-form"
/>
```

#### `SchemaTable`

Renders a sortable table from a schema.

```typescript
<SchemaTable
  schema={userSchema}
  data={users}
  sortField={sortField}
  sortDirection={sortDirection}
  onSort={handleSort}
/>
```

#### `SchemaCardGrid`

Renders a card grid from a schema.

```typescript
<SchemaCardGrid
  schema={userCardSchema}
  data={users}
  onItemClick={(item) => console.log(item)}
  className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
/>
```

### Metadata Types

#### Form Metadata

```typescript
interface FormFieldMetadata {
  label: string;
  placeholder?: string;
  inputType?: "text" | "email" | "number" | "textarea" | "select" | "checkbox";
  rows?: number;
  required?: boolean;
  showWhen?: ConditionalDisplay;
}
```

#### Table Metadata

```typescript
interface TableColumnMetadata {
  label: string;
  width?: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  displayType?: "text" | "email" | "date" | "badge" | "link";
  showWhen?: ConditionalDisplay;
}
```

#### Card Metadata

```typescript
interface CardItemMetadata {
  label: string;
  size?: "sm" | "md" | "lg";
  showInPreview?: boolean;
  icon?: string;
  style?: "primary" | "secondary" | "accent" | "muted";
  clickable?: boolean;
  position?: "header" | "body" | "footer";
  showWhen?: ConditionalDisplay;
}
```

### Conditional Display

```typescript
type ConditionalDisplay =
  | {
      field: string;
      condition:
        | "equals"
        | "not_equals"
        | "contains"
        | "greater_than"
        | "less_than";
      value: any;
    }
  | {
      field: string;
      condition: "custom";
      predicate: (fieldValue: any, allValues: Record<string, any>) => boolean;
    };
```

## Usage Patterns

### 1. Basic Entity Definition

```typescript
// Define entity with all view types
const userSchemas = defineEntity({
  name: "User",
  transport: "server-actions",
  serverActions: userServerActions,
  fields: {
    name: defineField(z.string().min(2))
      .form({ label: "Full Name", placeholder: "Enter name" })
      .table({ label: "Name", sortable: true })
      .card({ label: "Name", position: "header" })
      .build(),

    email: defineField(z.string().email())
      .form({ label: "Email", inputType: "email" })
      .table({ label: "Email", displayType: "email" })
      .card({ label: "Email", position: "body" })
      .build(),
  },
});

// Export schemas
export const userSchema = userSchemas.schema;
export const userFormSchema = userSchemas.formSchema;
export const userCardSchema = userSchemas.cardSchema;
```

### 2. Complete CRUD Application

```typescript
// Component using the entity
const UserManager = () => {
  const { useList, useCreate, useUpdate, useDelete } = useEntity(userSchema);
  const { data: users, isLoading } = useList();
  const createUser = useCreate();

  const handleSubmit = async (data: any) => {
    await createUser.mutateAsync({ data });
  };

  return (
    <div>
      <SchemaForm schema={userFormSchema} onSubmit={handleSubmit} />
      <SchemaTable schema={userSchema} data={users?.data || []} />
    </div>
  );
};
```

### 3. Conditional Fields

```typescript
const conditionalSchema = defineEntity({
  name: "ConditionalUser",
  fields: {
    role: defineField(z.enum(["admin", "user"]))
      .form({ label: "Role", inputType: "select" })
      .build(),

    // Only show for admin users
    adminNotes: defineField(z.string().optional())
      .form({
        label: "Admin Notes",
        inputType: "textarea",
        showWhen: {
          field: "role",
          condition: "equals",
          value: "admin",
        },
      })
      .build(),
  },
});
```

### 4. Custom Server Actions

```typescript
// Server actions for data operations
export const userServerActions = {
  list: listUsersAction,
  get: getUserAction,
  create: createUserAction,
  update: updateUserAction,
  delete: deleteUserAction,
};

// Use in schema definition
const userSchemas = defineEntity({
  name: "User",
  transport: "server-actions",
  serverActions: userServerActions,
  fields: {
    /* ... */
  },
});
```

## Advanced Features

### 1. Custom Component Types

Add new component types to existing views:

```typescript
// Extend form registry with custom component
const customFormComponentMap = {
  ...formComponentMap,
  "rich-text": renderRichTextComponent,
  "file-upload": renderFileUploadComponent,
};

// Use custom registry
const customFormRegistry = createViewRegistry(
  customFormComponentMap,
  getFormComponentType,
  buildFormProps
);
```

### 2. New View Types

Create entirely new view types:

```typescript
// 1. Define metadata type
interface ListItemMetadata extends BaseMetadata {
  showBullet?: boolean;
  indent?: number;
}

// 2. Create component map
const listComponentMap = {
  text: renderListTextItem,
  number: renderListNumberItem,
};

// 3. Create registry
const listRegistry = createViewRegistry(
  listComponentMap,
  getListComponentType,
  buildListProps
);

// 4. Create view component
const SchemaList = ({ schema, data }) => {
  // Implementation using listRegistry
};
```

### 3. Schema Transforms

Transform data before rendering:

```typescript
// Transform schema for specific view
const transformedSchema = z.object({
  ...userSchema.shape,
  displayName: z.string().transform((name) => name.toUpperCase()),
});

<SchemaTable schema={transformedSchema} data={users} />;
```

### 4. Custom Validation

Add complex validation rules:

```typescript
defineEntity({
  name: "User",
  validation: [
    {
      message: "Email domain must match role",
      path: ["email"],
      validate: (values) => {
        if (values.role === "admin") {
          return values.email?.endsWith("@company.com");
        }
        return true;
      },
    },
  ],
  fields: {
    /* ... */
  },
});
```
