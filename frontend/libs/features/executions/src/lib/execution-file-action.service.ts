import { Injectable } from '@angular/core';
import {
  ExecutionFileActionKind,
  ExecutionFileActionRequest,
  ProcessedSourceFileRecord,
} from './execution.models';

@Injectable()
export class ExecutionFileActionService {
  selectedFileReferences(request: ExecutionFileActionRequest): string[] {
    return request.files.map((item) => this.fileReference(item)).filter(Boolean);
  }

  successMessage(kind: ExecutionFileActionKind, executionId: number): string {
    return `${this.actionMessage(kind)} ID de ejecucion: ${executionId}`;
  }

  private actionMessage(kind: ExecutionFileActionKind): string {
    switch (kind) {
      case 'retryFailed':
        return 'Reintento de archivos fallidos lanzado.';
      case 'processPending':
        return 'Procesamiento de archivos pendientes lanzado.';
      default:
        return 'Reproceso de archivos seleccionados lanzado.';
    }
  }

  private fileReference(file: Pick<ProcessedSourceFileRecord, 'filePath' | 'fileName'>): string {
    return String(file.filePath || file.fileName || '').trim();
  }
}
