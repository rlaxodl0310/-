export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type Source = 'ai' | 'local';
export interface Exchange { actor: string; stage: string; text: string; }
export interface Provider { id?: string; label?: string; check(options?: { signal?: AbortSignal }): Promise<{ ready: boolean }>; generate(messages: {role: string; content: string}[], schema: Json, options?: { signal?: AbortSignal }): Promise<Json>; }
export interface Receipt { version: 1; coreVersion: string; projectId: string; requestId: string; taskId: string; signature: string; source: Source; proposal: Json; exchange: Exchange[]; approvedAt: number; }
export interface Memory { id: string; kind: 'fact' | 'claim' | 'decision'; text: string; source: { type: 'user' | 'application' | 'model'; id: string }; tags: string[]; }
export interface Store { withLock<T>(projectId: string, fn: () => Promise<T>): Promise<T>; getReceipt(projectId: string, requestId: string): Promise<Receipt | null>; putReceipt(projectId: string, requestId: string, receipt: Receipt): Promise<void>; listMemories(projectId: string): Promise<Memory[]>; putMemory(projectId: string, memory: Memory): Promise<void>; }
export interface Task<T = Json> { projectId: string; requestId: string; taskId: string; adapterVersion?: string; instructions: string; input?: Json; context?: Json; schema: Json; localOnly?: boolean; signal?: AbortSignal; local?: ((meta: { context: Json; input: Json }) => Json | Promise<Json>) | null; validate?: (proposal: Json, meta: { context: Json; input: Json }) => void | boolean | Promise<void | boolean>; prepare?: (proposal: Json, meta: { source: Source; exchange: Exchange[]; replayed: boolean }) => T | Promise<T>; labels?: { context?: string; local?: string; approved?: string }; }
export class TangTang { constructor(options?: { provider?: Provider | null; store?: Store; maxRepairs?: number; maxContextChars?: number; maxProposalChars?: number; schemaValidator?: ((schema: Json, proposal: Json) => void | boolean | Promise<void | boolean>) | null; clock?: () => number }); run<T = Json>(task: Task<T>): Promise<Receipt & { prepared: T; replayed: boolean }>; remember(memory: Omit<Memory, 'tags'> & { projectId: string; tags?: string[] }): Promise<Memory>; recall(query: { projectId: string; query?: string; maxChars?: number; kinds?: Memory['kind'][] }): Promise<Memory[]>; }
export class TangTangError extends Error { constructor(code: string, message: string, details?: Record<string, unknown>); code: string; details: Record<string, unknown>; }
export class MemoryStore implements Store { withLock<T>(projectId: string, fn: () => Promise<T>): Promise<T>; getReceipt(projectId: string, requestId: string): Promise<Receipt | null>; putReceipt(projectId: string, requestId: string, receipt: Receipt): Promise<void>; listMemories(projectId: string): Promise<Memory[]>; putMemory(projectId: string, memory: Memory): Promise<void>; }
export function createBridgeProvider(bridge: { check(options?: { signal?: AbortSignal }): Promise<{ ready: boolean }>; generateStructured(messages: {role: string; content: string}[], schema: Json, options?: { signal?: AbortSignal }): Promise<Json> }, options?: { label?: string; providerId?: string }): Provider;
export function canonical(value: Json): string;
export function fingerprint(value: Json): Promise<string>;
export function inspectSchema(schema: Json): void;
export function validateSchema(schema: Json, value: Json): void;
export const NAME: '탱탱';
export const VERSION: '0.1.0';
