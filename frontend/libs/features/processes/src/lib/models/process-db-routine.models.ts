export interface DbRoutineRef {
  schema: string | null;
  name: string;
  qualifiedName: string;
  routineType: 'PROCEDURE' | 'FUNCTION' | string;
}

export interface DbRoutineParameterRef {
  schema: string | null;
  routineName: string | null;
  parameterName: string;
  jdbcType: string | null;
  direction: string | null;
  position: number | null;
}
