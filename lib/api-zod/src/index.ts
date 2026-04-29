// The zod schema names from `./generated/api` collide with the interface
// names re-exported from `./generated/types` (e.g. CreateTaskBody). The runtime
// schema lives in api.ts; the matching TS type comes from the types/ folder.
// We re-export both, but rename the overlapping interfaces to *Type so they
// don't shadow the zod schemas.
export * from "./generated/api";

// Generic types (no name collision)
export * from "./generated/types/authorizationSessionHeaderParameter";
export * from "./generated/types/authUser";
export * from "./generated/types/authUserEnvelope";
export * from "./generated/types/beginBrowserLoginParams";
export * from "./generated/types/createSessionBodySessionType";
export * from "./generated/types/createTaskBodyPriority";
export * from "./generated/types/errorEnvelope";
export * from "./generated/types/handleBrowserLoginCallbackParams";
export * from "./generated/types/healthStatus";
export * from "./generated/types/listSessionsParams";
export * from "./generated/types/listTasksParams";
export * from "./generated/types/listTasksPriority";
export * from "./generated/types/logoutSuccess";
export * from "./generated/types/mobileTokenExchangeRequest";
export * from "./generated/types/mobileTokenExchangeSuccess";
export * from "./generated/types/statsSummary";
export * from "./generated/types/streakInfo";
export * from "./generated/types/studySession";
export * from "./generated/types/studySessionSessionType";
export * from "./generated/types/updateSessionBodySessionType";
export * from "./generated/types/updateTaskBodyPriority";

// Conflicting interface names: re-export type-only with a `Type` suffix
export type { CreateSessionBody as CreateSessionBodyType } from "./generated/types/createSessionBody";
export type { CreateSubjectBody as CreateSubjectBodyType } from "./generated/types/createSubjectBody";
export type { CreateTaskBody as CreateTaskBodyType } from "./generated/types/createTaskBody";
export type { UpdateSessionBody as UpdateSessionBodyType } from "./generated/types/updateSessionBody";
export type { UpdateSubjectBody as UpdateSubjectBodyType } from "./generated/types/updateSubjectBody";
export type { UpdateTaskBody as UpdateTaskBodyType } from "./generated/types/updateTaskBody";
