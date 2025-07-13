import type {
  ListParams,
  GetParams,
  SearchParams,
  CreateParams,
  UpdateParams,
  DeleteParams,
  ListResult,
  SearchResult,
  EntityId,
  BaseEntity,
} from "./query/types";

// Mock user type matching the schema in App.tsx
interface User extends BaseEntity {
  name: string;
  email: string;
  age: number;
  status: "active" | "inactive" | "pending";
  role: "admin" | "user" | "guest";
  bio: string;
  adminNotes?: string;
  pendingReason?: string;
  phoneNumber?: string;
  createdAt: Date;
}

// Mock database
let mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@company.com",
    age: 30,
    status: "active",
    role: "admin",
    bio: "Senior software engineer with 8 years of experience in full-stack development.",
    adminNotes: "Department head, access to all systems",
    phoneNumber: "+1 (555) 123-4567",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    age: 28,
    status: "inactive",
    role: "user",
    bio: "Product designer focused on user experience and interface design.",
    createdAt: new Date("2023-03-22"),
    updatedAt: new Date("2023-03-22"),
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    age: 35,
    status: "pending",
    role: "guest",
    bio: "Marketing specialist with expertise in digital campaigns and analytics.",
    pendingReason: "Waiting for background check completion",
    createdAt: new Date("2023-02-10"),
    updatedAt: new Date("2023-02-10"),
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock server action for listing users
 */
export async function listUsersAction(
  params?: ListParams
): Promise<ListResult<User>> {
  "use server";

  console.log("🚀 Server Action: listUsersAction called", params);
  await delay(300); // Simulate network delay

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const sort = params?.sort || "createdAt";
  const order = params?.order || "desc";

  // Simple sorting
  const sortedUsers = [...mockUsers].sort((a, b) => {
    const aVal = a[sort as keyof User];
    const bVal = b[sort as keyof User];

    // Handle undefined values by treating them as empty strings for string fields
    // and as 0 for numeric fields, and as earliest date for date fields
    const getSafeValue = (val: unknown) => {
      if (val === undefined || val === null) {
        return "";
      }
      return val;
    };

    const safeAVal = getSafeValue(aVal);
    const safeBVal = getSafeValue(bVal);

    if (order === "asc") {
      return safeAVal > safeBVal ? 1 : -1;
    } else {
      return safeAVal < safeBVal ? 1 : -1;
    }
  });

  // Simple pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedUsers = sortedUsers.slice(start, end);

  return {
    data: paginatedUsers,
    meta: {
      total: mockUsers.length,
      page,
      limit,
      hasNext: end < mockUsers.length,
      hasPrev: page > 1,
    },
  };
}

/**
 * Mock server action for getting a single user
 */
export async function getUserAction(
  params: GetParams<EntityId>
): Promise<User> {
  "use server";

  console.log("🚀 Server Action: getUserAction called", params);
  await delay(200);

  const user = mockUsers.find((u) => u.id === String(params.id));
  if (!user) {
    throw new Error(`User not found: ${params.id}`);
  }

  return user;
}

/**
 * Mock server action for searching users
 */
export async function searchUsersAction(
  params: SearchParams
): Promise<SearchResult<User>> {
  "use server";

  console.log("🚀 Server Action: searchUsersAction called", params);
  await delay(250);

  const query = params.query.toLowerCase();
  const limit = params.limit || 10;

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.bio.toLowerCase().includes(query)
  );

  return {
    data: filteredUsers.slice(0, limit),
    meta: {
      total: filteredUsers.length,
      query: params.query,
      took: 25, // Mock search time in ms
    },
  };
}

/**
 * Mock server action for creating a user
 */
export async function createUserAction(
  params: CreateParams<User>
): Promise<User> {
  "use server";

  console.log("🚀 Server Action: createUserAction called", params);
  await delay(400);

  const newUser: User = {
    ...params.data,
    id: `user_${Date.now()}`, // Generate mock ID
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockUsers.push(newUser);

  return newUser;
}

/**
 * Mock server action for updating a user
 */
export async function updateUserAction(
  params: UpdateParams<User, EntityId>
): Promise<User> {
  "use server";

  console.log("🚀 Server Action: updateUserAction called", params);
  await delay(350);

  const userIndex = mockUsers.findIndex((u) => u.id === String(params.id));
  if (userIndex === -1) {
    throw new Error(`User not found: ${params.id}`);
  }

  const updatedUser: User = {
    ...mockUsers[userIndex],
    ...params.data,
    updatedAt: new Date(),
  };

  mockUsers[userIndex] = updatedUser;

  return updatedUser;
}

/**
 * Mock server action for deleting a user
 */
export async function deleteUserAction(
  params: DeleteParams<EntityId>
): Promise<void> {
  "use server";

  console.log("🚀 Server Action: deleteUserAction called", params);
  await delay(300);

  const userIndex = mockUsers.findIndex((u) => u.id === String(params.id));
  if (userIndex === -1) {
    throw new Error(`User not found: ${params.id}`);
  }

  mockUsers.splice(userIndex, 1);
}

/**
 * Export all actions as a group for easy use
 */
export const userServerActions = {
  list: listUsersAction,
  get: getUserAction,
  search: searchUsersAction,
  create: createUserAction,
  update: updateUserAction,
  delete: deleteUserAction,
};
