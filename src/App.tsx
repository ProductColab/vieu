import { useState } from "react";
import "./App.css";
import * as z from "zod";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  SchemaForm,
  SchemaTable,
  SchemaCardGrid,
  SchemaList,
  SchemaDetail,
  useTableSort,
} from "./lib/views";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { userSchemaV2, userFormSchemaV2 } from "./lib/schemas/user-v2";
import { useEntity } from "./lib/query";
import { SchemaBuilderProvider } from "./lib/schema-builder/schema-builder.provider";
import { SchemaBuilderLayout } from "./lib/schema-builder/components";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

const AppContent = () => {
  const [showForm, setShowForm] = useState(true);
  const [viewMode, setViewMode] = useState<
    "table" | "cards" | "list" | "detail"
  >("table");
  const [selectedItem, setSelectedItem] = useState<Record<
    string,
    unknown
  > | null>(null);
  const { sortField, sortDirection, handleSort, sortData } = useTableSort();

  const { useList, useCreate } = useEntity(userSchemaV2 as any);

  const { data: serverUsers, isLoading, error } = useList();
  const createUser = useCreate();

  const handleFormSubmit = async (data: unknown) => {
    console.log("Form submitted:", data);
    try {
      await createUser.mutateAsync({ data: data as any });
      console.log("User created successfully!");
      setShowForm(false);
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const generateJsonSchema = () => {
    try {
      const jsonSchema = z.toJSONSchema(userFormSchemaV2, {
        metadata: z.globalRegistry,
        unrepresentable: "any",
      });
      console.log("Generated JSON Schema:", jsonSchema);
      alert("JSON Schema generated! Check the console for details.");
    } catch (error) {
      console.error("Error generating JSON Schema:", error);
      alert("Error generating JSON Schema. Check console for details.");
    }
  };

  // Use server data (no fallback to sample data)
  const allData = serverUsers?.data || [];
  const sortedData = sortData(allData as any);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-8">Loading...</h1>
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-8 text-red-600">
            Error Loading Data
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">
              {error instanceof Error
                ? error.message
                : "Unknown error occurred"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Generic Schema Registry - Demo & Builder
        </h1>

        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="demo">Schema Demo</TabsTrigger>
            <TabsTrigger value="builder">Schema Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                🎯 Generic Architecture Benefits
              </h2>
              <ul className="text-green-700 space-y-1 text-sm">
                <li>
                  ✅ Same schema works for form, table, card, list, and detail
                  views
                </li>
                <li>✅ Zero code duplication between view types</li>
                <li>
                  ✅ Generic type inference (email detection, select options,
                  etc.)
                </li>
                <li>✅ Extensible for new view types with minimal effort</li>
                <li>
                  ✅ Single Responsibility Principle - each component does one
                  thing
                </li>
                <li>✅ DRY - Don't Repeat Yourself principle</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                🚀 NEW: Smart Field Architecture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold text-blue-700 mb-1">
                    Old Approach:
                  </h3>
                  <ul className="text-blue-600 space-y-1">
                    <li>📊 612 lines of repetitive code</li>
                    <li>🔄 Same labels/icons repeated 5x each</li>
                    <li>😓 Manual configuration for every view</li>
                    <li>🐛 Easy to create inconsistencies</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-700 mb-1">
                    New Approach:
                  </h3>
                  <ul className="text-blue-600 space-y-1">
                    <li>📊 ~150 lines (85% reduction!)</li>
                    <li>🎯 Smart defaults + context overrides</li>
                    <li>✨ Semantic field types (email, phone, etc.)</li>
                    <li>🔧 Type-safe schema inference</li>
                  </ul>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-100 rounded-md">
                <p className="text-blue-800 text-sm">
                  <strong>Example:</strong> <code>semanticFields.email()</code>{" "}
                  automatically infers: inputType="email", icon="✉️",
                  displayType="email", clickable=true
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Form Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Generic Form Component
                  </h2>
                  <Button
                    onClick={() => setShowForm(!showForm)}
                    variant="default"
                    size="sm"
                  >
                    {showForm ? "Hide Form" : "Show Form"}
                  </Button>
                </div>

                {showForm && (
                  <>
                    <p className="text-gray-600 mb-6 text-sm">
                      Uses the same schema as the table and cards, but renders
                      as form inputs with validation.
                    </p>
                    <SchemaForm
                      schema={userFormSchemaV2}
                      onSubmit={handleFormSubmit}
                    />
                  </>
                )}

                <div className="mt-6">
                  <Button
                    onClick={generateJsonSchema}
                    className="w-full"
                    variant="default"
                  >
                    Generate JSON Schema
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Schema generation works with all view registries
                  </p>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">
                    🎯 Conditional Logic & Validation Demo
                  </h3>
                  <ul className="text-blue-700 space-y-1 text-sm">
                    <li>• Select "admin" role to see Admin Notes field</li>
                    <li>
                      • Select "pending" status to see Pending Reason field
                    </li>
                    <li>
                      • Select "active" + age ≥21 to see Phone Number field
                    </li>
                    <li>
                      • Try invalid combinations to see cross-field validation
                    </li>
                    <li>
                      • <strong>Switch to table/card/list/detail views</strong>{" "}
                      - conditional columns/fields appear based on each row's
                      data!
                    </li>
                  </ul>
                </div>
              </div>

              {/* Data View Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Generic Data Views</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setViewMode("table")}
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                    >
                      Table View
                    </Button>
                    <Button
                      onClick={() => setViewMode("cards")}
                      variant={viewMode === "cards" ? "default" : "outline"}
                      size="sm"
                    >
                      Card View
                    </Button>
                    <Button
                      onClick={() => setViewMode("list")}
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                    >
                      List View
                    </Button>
                    <Button
                      onClick={() => setViewMode("detail")}
                      variant={viewMode === "detail" ? "default" : "outline"}
                      size="sm"
                      disabled={!selectedItem}
                    >
                      Detail View
                    </Button>
                  </div>
                </div>

                <p className="text-gray-600 mb-6 text-sm">
                  Same schema, different rendering. Switch between table, card,
                  list, and detail views. Select an item to view its details.
                </p>

                {viewMode === "table" ? (
                  <div className="overflow-x-auto">
                    <SchemaTable
                      schema={userSchemaV2}
                      data={sortedData}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      className="w-full"
                    />
                  </div>
                ) : viewMode === "cards" ? (
                  <SchemaCardGrid
                    schema={userSchemaV2}
                    data={sortedData}
                    onItemClick={(item) => {
                      setSelectedItem(item);
                      console.log("Card clicked:", item);
                    }}
                    className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  />
                ) : viewMode === "list" ? (
                  <SchemaList
                    schema={userSchemaV2}
                    data={sortedData}
                    onItemClick={(item) => {
                      setSelectedItem(item);
                      console.log("List item clicked:", item);
                    }}
                    onAction={(action, item) =>
                      console.log("Action:", action, "on item:", item)
                    }
                    className="max-w-4xl mx-auto"
                  />
                ) : viewMode === "detail" && selectedItem ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">User Details</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode("table")}
                      >
                        ← Back to List
                      </Button>
                    </div>
                    <SchemaDetail
                      schema={userSchemaV2}
                      data={selectedItem}
                      onClick={(fieldName, value) =>
                        console.log("Detail field clicked:", fieldName, value)
                      }
                      onAction={(action, fieldName, itemData) =>
                        console.log(
                          "Detail action:",
                          action,
                          fieldName,
                          itemData
                        )
                      }
                      layout="single-column"
                      className="bg-white p-6 rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      Select an item to view its details
                    </p>
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-500">
                  Showing {allData.length} records in {viewMode} view
                </div>
              </div>
            </div>

            {/* Architecture Explanation */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                🏗️ Architecture Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Generic Components:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • <code>createSchemaFieldRenderer()</code> - Universal
                      field renderer
                    </li>
                    <li>
                      • <code>createSchemaWrapper()</code> - Generic container
                    </li>
                    <li>
                      • <code>useSchemaData()</code> - Data management hook
                    </li>
                    <li>
                      • <code>createComponentTypeGetter()</code> - Type
                      inference
                    </li>
                    <li>
                      • <code>getGenericInputType()</code> - Universal type
                      detection
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">View Types:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • <code>SchemaForm</code> - Form validation & submission
                    </li>
                    <li>
                      • <code>SchemaTable</code> - Sorting & row rendering
                    </li>
                    <li>
                      • <code>SchemaCardGrid</code> - Card layout & preview
                    </li>
                    <li>
                      • <code>SchemaList</code> - List items with actions
                    </li>
                    <li>
                      • <code>SchemaDetail</code> - Rich detailed view with
                      sections
                    </li>
                    <li>
                      • <code>useTableSort()</code> - Table-specific sorting
                    </li>
                    <li>• Component maps define rendering per view type</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="builder">
            <SchemaBuilderProvider>
              <div className="h-[80vh]">
                <SchemaBuilderLayout />
              </div>
            </SchemaBuilderProvider>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Main App component with QueryClient provider
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
