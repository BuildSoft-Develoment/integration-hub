package com.integrationhub.platform.service.execution;

import com.integrationhub.platform.entity.ProcessedSourceFile;
import com.integrationhub.platform.repository.ProcessExecutionRepository;
import com.integrationhub.platform.repository.ProcessTaskDefinitionRepository;
import com.integrationhub.platform.repository.ProcessedSourceFileRepository;
import com.integrationhub.platform.spi.source.SelectedSourceFile;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;

@ApplicationScoped
public class ProcessedSourceFileService {

    private final ProcessedSourceFileRepository processedSourceFileRepository;
    private final ProcessExecutionRepository processExecutionRepository;
    private final ProcessTaskDefinitionRepository processTaskDefinitionRepository;

    public ProcessedSourceFileService(ProcessedSourceFileRepository processedSourceFileRepository,
                                      ProcessExecutionRepository processExecutionRepository,
                                      ProcessTaskDefinitionRepository processTaskDefinitionRepository) {
        this.processedSourceFileRepository = processedSourceFileRepository;
        this.processExecutionRepository = processExecutionRepository;
        this.processTaskDefinitionRepository = processTaskDefinitionRepository;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void recordPipelineFiles(Long processExecutionId,
                                    Long taskDefinitionId,
                                    List<SelectedSourceFile> selectedFiles,
                                    List<StreamingPipelineService.BatchSummary> completedFiles,
                                    List<StreamingPipelineService.StreamFailureSummary> failedFiles) {
        var execution = processExecutionRepository.findById(processExecutionId);
        var taskDefinition = processTaskDefinitionRepository.findById(taskDefinitionId);
        processedSourceFileRepository.deleteByExecutionAndTask(processExecutionId, taskDefinitionId);

        var completedByName = new HashMap<String, StreamingPipelineService.BatchSummary>();
        completedFiles.forEach(summary -> completedByName.put(summary.fileName(), summary));
        var failedByName = new HashMap<String, StreamingPipelineService.StreamFailureSummary>();
        failedFiles.forEach(summary -> failedByName.put(summary.fileName(), summary));

        for (var file : selectedFiles) {
            var row = new ProcessedSourceFile();
            row.processExecution = execution;
            row.taskDefinition = taskDefinition;
            row.fileName = file.name();
            row.filePath = file.location();
            row.mediaType = file.mediaType();
            row.fileSize = file.size();
            row.lastModified = file.lastModified();
            row.createdAt = LocalDateTime.now();

            var completed = completedByName.get(file.name());
            if (completed != null) {
                row.status = "COMPLETED";
                row.recordCount = completed.recordCount();
                row.skippedCount = completed.skippedCount();
                row.writtenCount = completed.writtenCount();
            } else {
                var failed = failedByName.get(file.name());
                if (failed != null) {
                    row.status = "FAILED";
                    row.errorMessage = failed.message();
                } else {
                    row.status = "PENDING";
                }
            }
            processedSourceFileRepository.persist(row);
        }
    }
}
