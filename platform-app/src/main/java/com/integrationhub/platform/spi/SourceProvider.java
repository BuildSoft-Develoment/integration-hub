package com.integrationhub.platform.spi;

import java.util.List;
import java.util.Map;

public interface SourceProvider {

    String type();

    List<SelectedSourceFile> selectFiles(Map<String, Object> configuration);

    SourcePayload openFile(SelectedSourceFile selectedFile, Map<String, Object> configuration);
}
