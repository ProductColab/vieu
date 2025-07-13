# vieu POC

A proof-of-concept for declarative views using Zod schemas as the source of truth.

## Concept

Stop writing the same boilerplate code for forms, tables, and other views. With vieu, you define your business logic once in a Zod schema, then register metadata to automatically generate beautiful, type-safe UIs.

## Key Features

- **Schema-first**: Zod schemas are your single source of truth
- **Metadata registries**: Associate UI metadata with your schemas
- **Type safety**: Full TypeScript support with inference
- **Automatic generation**: Forms, tables, and other views generated automatically
- **Beautiful UI**: Built on shadcn/ui components

## How It Works

1. **Define pure schemas** with only business logic (validation rules)
2. **Register metadata** separately for different view types
3. **Generate multiple views** from the same schema with different metadata
4. **Get validation, types, and beautiful UI for free**

## Key Insight: Native Zod + JSON Schema Architecture

The schema uses **native Zod metadata** (`.meta()` and `.describe()`) for shared information across all views. **`z.toJSONSchema()`** automatically extracts all metadata. View-specific registries only handle view-specific concerns.

## Example

```typescript
import * as z from "zod";
import {
  registerFormMeta,
  registerTableMeta,
  VieuForm,
  VieuTable,
} from "./lib/vieu";

// 1. Define schema with native Zod metadata (shared across all views)
const emailSchema = z
  .string()
  .email()
  .describe("We'll never share your email")
  .meta({
    label: "Email Address",
    placeholder: "john@example.com",
    inputType: "email",
  });

const ageSchema = z
  .number()
  .min(18, "Must be 18 or older")
  .describe("Your age")
  .meta({
    label: "Age",
    placeholder: "25",
    inputType: "number",
  });

const userSchema = z.object({
  email: emailSchema,
  age: ageSchema,
});

// 2. Register only VIEW-SPECIFIC metadata
registerFormMeta(emailSchema, {
  size: "md",
  helperText: "We'll send updates here",
});

registerTableMeta(emailSchema, {
  sortable: true,
  width: "250px",
});

// 3. Generate views (uses z.toJSONSchema() internally)
function MyViews() {
  const handleSubmit = (data: z.infer<typeof userSchema>) => {
    console.log("Validated data:", data);
  };

  return (
    <div>
      {/* Form view */}
      <VieuForm schema={userSchema} onSubmit={handleSubmit} />

      {/* Table view */}
      <VieuTable schema={userSchema} data={users} />
    </div>
  );
}
```

## Architecture

- **Native Zod Metadata**: Uses `.meta()` and `.describe()` for shared metadata
- **JSON Schema Conversion**: `z.toJSONSchema()` extracts all metadata automatically
- **View-Specific Registries**: Store only view-specific concerns
- **Generators**: Create view configurations from schemas + metadata
- **Components**: Render views based on configurations

## Benefits of This Architecture

✅ **No duplication** - Common metadata (labels, descriptions, types) defined once in schema  
✅ **Automatic inference** - Types, validation, and constraints extracted automatically  
✅ **View separation** - Only view-specific concerns in registries  
✅ **Native Zod features** - Leverages Zod's built-in metadata system  
✅ **JSON Schema compatible** - Can export to JSON Schema for other tools  
✅ **Type safety** - Full TypeScript support throughout  
✅ **Extensible** - Easy to add new view types without touching schemas

## Future Possibilities

- Table views with sorting, filtering, pagination
- Card layouts for displaying data
- API documentation generation
- JSON Schema export
- GraphQL schema generation
- Database migrations
- AI form generation

## Running the POC

```bash
bun install
bun dev
```

Open http://localhost:5173 to see the demo.

## Technology Stack

- **Zod v4**: Schema validation with registries
- **React**: UI framework
- **TypeScript**: Type safety
- **shadcn/ui**: Beautiful components
- **Tailwind CSS**: Styling
- **React Hook Form**: Form handling
- **Vite**: Build tool
