// Shared Types for FORMA

// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

// Workspace types
export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
  members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  user_id: string;
  role: "owner" | "admin" | "member";
  user?: User;
}

// Project types
export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

// Render types
export interface Render {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  image_url?: string;
  created_at: string;
}

// Artifact types
export interface Artifact {
  id: string;
  type: "document" | "spreadsheet" | "html";
  title: string;
  content: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

// Agent types
export interface AgentTask {
  id: string;
  user_id: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: string;
  artifacts?: Artifact[];
  created_at: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read_at?: string;
  action_url?: string;
  created_at: string;
}

// Comment types
export interface Comment {
  id: string;
  user_id: string;
  artifact_id?: string;
  render_id?: string;
  content: string;
  created_at: string;
  user?: User;
}

// Share link types
export interface ShareLink {
  id: string;
  artifact_id?: string;
  render_id?: string;
  token: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color: string;
  workspace_id: string;
}

// Deadline types
export interface Deadline {
  id: string;
  project_id: string;
  title: string;
  due_date: string;
  completed: boolean;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form types
export interface CreateProjectForm {
  name: string;
  description?: string;
  tags?: string[];
}

export interface UpdateProjectForm {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface CreateRenderForm {
  project_id: string;
  prompt: string;
  title?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

export interface FilterState {
  search?: string;
  sort?: "asc" | "desc";
  dateRange?: {
    start: string;
    end: string;
  };
}

// Floor Plan types (Mini Archi)
export interface FloorPlan {
  id: string;
  title: string;
  description: string;
  svg: string;
  selected: boolean;
}

export interface ArConstraint {
  surface?: string;
  rooms?: string;
  budget?: string;
  constraints: string;
}

export interface BudgetEstimate {
  category: string;
  min: number;
  max: number;
  items: string[];
}