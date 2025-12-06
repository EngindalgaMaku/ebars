/**
 * EBARS Simulation API Service
 * API functions for EBARS simulation management
 */

import { apiClient } from "./api-client";
import { URLS } from "@/config/ports";

// ===== CONFIGURATION =====
function getApiUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: always use /api (Next.js rewrites will proxy to backend over HTTPS)
    return "/api";
  }
  // Server-side: use default (for SSR)
  return URLS.API_GATEWAY;
}

const API_BASE_URL = () => getApiUrl();

// ===== TYPE DEFINITIONS =====

export interface EBARSAgent {
  agent_id: string;
  name: string;
  grade_level: string;
  subject_areas: string[];
  learning_style: string;
  difficulty_preference: string;
  interaction_count: number;
  avg_score: number;
  current_comprehension_level: number;
  status: "active" | "paused" | "completed";
}

export interface SimulationConfig {
  simulation_name: string;
  session_id: string;
  agent_count: number;
  turn_count: number;
  difficulty_levels: string[];
  subject_areas: string[];
  interaction_delay_ms?: number;
  enable_adaptation?: boolean;
  enable_analytics?: boolean;
}

export interface SimulationStatus {
  simulation_id: string;
  name: string;
  status: "preparing" | "running" | "paused" | "completed" | "failed";
  session_id: string;
  agent_count: number;
  current_turn: number;
  total_turns: number;
  completed_interactions: number;
  total_interactions: number;
  start_time: string;
  end_time?: string;
  estimated_completion?: string;
  progress_percentage: number;
  active_agents: number;
  current_phase: string;
  error_message?: string;
}

export interface SimulationMetrics {
  total_interactions: number;
  avg_response_time_ms: number;
  avg_accuracy_score: number;
  difficulty_distribution: Record<string, number>;
  comprehension_progression: {
    turn: number;
    avg_comprehension: number;
    agent_count: number;
  }[];
  performance_by_subject: Record<
    string,
    {
      interaction_count: number;
      avg_score: number;
      improvement_rate: number;
    }
  >;
}

export interface SimulationResult {
  simulation_id: string;
  name: string;
  session_id: string;
  status: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  agent_count: number;
  total_turns: number;
  total_interactions: number;
  metrics: SimulationMetrics;
  agents: EBARSAgent[];
  interaction_logs?: SimulationInteraction[];
}

export interface SimulationInteraction {
  interaction_id: string;
  agent_id: string;
  turn: number;
  timestamp: string;
  query: string;
  response: string;
  score: number;
  difficulty_level: string;
  subject_area: string;
  response_time_ms: number;
  comprehension_delta: number;
  sources_used: string[];
}

export interface SessionInfo {
  session_id: string;
  name: string;
  description: string;
  document_count: number;
  chunk_count: number;
  category: string;
}

// ===== UTILITY FUNCTIONS =====

function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

async function makeAuthenticatedRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("No access token found");
  }

  const response = await fetch(`${API_BASE_URL()}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return response;
}

// ===== API FUNCTIONS =====

/**
 * Get available sessions for simulation
 */
export async function getAvailableSessions(): Promise<SessionInfo[]> {
  const response = await makeAuthenticatedRequest("/sessions");

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to fetch sessions: ${response.status}`
    );
  }

  const sessions = await response.json();
  return sessions.map((session: any) => ({
    session_id: session.session_id,
    name: session.name,
    description: session.description || "",
    document_count: session.document_count || 0,
    chunk_count: session.total_chunks || 0,
    category: session.category || "general",
  }));
}

/**
 * Start a new EBARS simulation
 */
export async function startSimulation(config: SimulationConfig): Promise<{
  simulation_id: string;
  message: string;
}> {
  const response = await makeAuthenticatedRequest("/ebars/simulation/start", {
    method: "POST",
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to start simulation: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Get list of running simulations
 */
export async function getRunningSimulations(): Promise<SimulationStatus[]> {
  const response = await makeAuthenticatedRequest("/ebars/simulation/running");

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        `Failed to fetch running simulations: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Get simulation status by ID
 */
export async function getSimulationStatus(
  simulationId: string
): Promise<SimulationStatus> {
  const response = await makeAuthenticatedRequest(
    `/ebars/simulation/${simulationId}/status`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        `Failed to fetch simulation status: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Get simulation results by ID
 */
export async function getSimulationResults(
  simulationId: string
): Promise<SimulationResult> {
  const response = await makeAuthenticatedRequest(
    `/ebars/simulation/${simulationId}/results`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        `Failed to fetch simulation results: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Get all simulation results (completed simulations)
 */
export async function getAllSimulationResults(): Promise<SimulationResult[]> {
  const response = await makeAuthenticatedRequest("/ebars/simulation/results");

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        `Failed to fetch simulation results: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Pause a running simulation
 */
export async function pauseSimulation(simulationId: string): Promise<{
  message: string;
  status: string;
}> {
  const response = await makeAuthenticatedRequest(
    `/ebars/simulation/${simulationId}/pause`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to pause simulation: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Resume a paused simulation
 */
export async function resumeSimulation(simulationId: string): Promise<{
  message: string;
  status: string;
}> {
  const response = await makeAuthenticatedRequest(
    `/ebars/simulation/${simulationId}/resume`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to resume simulation: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Stop a running simulation
 */
export async function stopSimulation(simulationId: string): Promise<{
  message: string;
  final_results?: SimulationResult;
}> {
  const response = await makeAuthenticatedRequest(
    `/ebars/simulation/${simulationId}/stop`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to stop simulation: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Delete a simulation (completed or failed)
 */
export async function deleteSimulation(simulationId: string): Promise<{
  message: string;
}> {
  const response = await makeAuthenticatedRequest(
    `/ebars/simulation/${simulationId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to delete simulation: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Get simulation interaction logs
 */
export async function getSimulationLogs(
  simulationId: string,
  limit?: number,
  offset?: number
): Promise<{
  interactions: SimulationInteraction[];
  total_count: number;
  has_more: boolean;
}> {
  let endpoint = `/ebars/simulation/${simulationId}/logs`;
  const params = new URLSearchParams();

  if (limit !== undefined) params.append("limit", limit.toString());
  if (offset !== undefined) params.append("offset", offset.toString());

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  const response = await makeAuthenticatedRequest(endpoint);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to fetch simulation logs: ${response.status}`
    );
  }

  return await response.json();
}

/**
 * Export simulation results to CSV
 */
export async function exportSimulationResults(
  simulationId: string
): Promise<Blob> {
  const response = await makeAuthenticatedRequest(
    `/ebars/simulation/${simulationId}/export`,
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        // Remove Content-Type for file download
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Failed to export simulation: ${response.status}`
    );
  }

  return await response.blob();
}

// ===== API CLIENT WRAPPER =====

export const ebarsSimulationApiClient = {
  // Session Management
  getAvailableSessions,

  // Simulation Control
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  deleteSimulation,

  // Status and Results
  getRunningSimulations,
  getSimulationStatus,
  getSimulationResults,
  getAllSimulationResults,
  getSimulationLogs,

  // Export
  exportSimulationResults,
};

export default ebarsSimulationApiClient;
