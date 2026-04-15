package com.integrationhub.platform.provider.source;

import java.net.http.HttpRequest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Predicate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class SourceConfigurationSupport {

    private static final Pattern TEMPLATE_PATTERN = Pattern.compile("\\{([^{}]+)}");
    private static final Pattern DATE_PLACEHOLDER_PATTERN = Pattern.compile("[yMdHhmsS:/_.-]+");

    private SourceConfigurationSupport() {
    }

    record FileNameRule(String description, Predicate<String> matcher) {
        boolean matches(String fileName) {
            return matcher.test(fileName);
        }
    }

    static String requireString(Map<String, Object> configuration, String key) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            throw new IllegalArgumentException("Missing required configuration key: " + key);
        }
        return String.valueOf(value);
    }

    static String optionalString(Map<String, Object> configuration, String key, String defaultValue) {
        Object value = configuration.get(key);
        return value == null || String.valueOf(value).isBlank() ? defaultValue : String.valueOf(value);
    }

    static int optionalInt(Map<String, Object> configuration, String key, int defaultValue) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    static boolean optionalBoolean(Map<String, Object> configuration, String key, boolean defaultValue) {
        Object value = configuration.get(key);
        if (value == null || String.valueOf(value).isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    @SuppressWarnings("unchecked")
    static Map<String, String> stringMap(Map<String, Object> configuration, String key) {
        Object value = configuration.get(key);
        if (value == null) {
            return Map.of();
        }
        if (!(value instanceof Map<?, ?> rawMap)) {
            throw new IllegalArgumentException("Configuration key must be an object: " + key);
        }

        Map<String, String> result = new LinkedHashMap<>();
        rawMap.forEach((mapKey, mapValue) -> result.put(String.valueOf(mapKey), mapValue == null ? "" : String.valueOf(mapValue)));
        return result;
    }

    static Duration timeout(Map<String, Object> configuration, int defaultSeconds) {
        return Duration.ofSeconds(optionalInt(configuration, "timeoutSeconds", defaultSeconds));
    }

    static String detectMediaType(String fileName, String configuredMediaType) {
        if (configuredMediaType != null && !configuredMediaType.isBlank()) {
            return configuredMediaType;
        }
        try {
            if (fileName != null && !fileName.isBlank()) {
                String detected = Files.probeContentType(Path.of(fileName));
                if (detected != null) {
                    return detected;
                }
            }
        } catch (Exception ignored) {
        }
        return "application/octet-stream";
    }

    static void applyHeaders(HttpRequest.Builder builder, Map<String, String> headers) {
        headers.forEach(builder::header);
    }

    static Map<String, String> templateVariables(Map<String, Object> configuration) {
        return stringMap(configuration, "templateVariables");
    }

    static String resolvePathTemplate(String template, Map<String, Object> configuration) {
        return resolvePathTemplateWithVariables(template, templateVariables(configuration));
    }

    static String selectionMode(Map<String, Object> configuration) {
        return optionalString(configuration, "selectionMode", "latestModified");
    }

    static FileNameRule fileNameRule(Map<String, Object> configuration) {
        String template = optionalString(configuration, "fileNameTemplate", null);
        if (template != null && !template.isBlank()) {
            return templateRule(template, templateVariables(configuration));
        }
        return null;
    }

    static String joinRemotePath(String directory, String fileName) {
        if (directory == null || directory.isBlank() || "/".equals(directory)) {
            return "/" + fileName;
        }
        if (directory.endsWith("/")) {
            return directory + fileName;
        }
        return directory + "/" + fileName;
    }

    private static String resolvePathTemplateWithVariables(String template, Map<String, String> variables) {
        if (template == null || template.isBlank()) {
            return template;
        }
        Matcher matcher = TEMPLATE_PATTERN.matcher(template);
        StringBuffer resolved = new StringBuffer();
        LocalDate today = LocalDate.now();
        while (matcher.find()) {
            String placeholder = matcher.group(1).trim();
            String replacement = matcher.group(0);
            if (isDatePlaceholder(placeholder)) {
                replacement = today.format(DateTimeFormatter.ofPattern(placeholder));
            } else if (variables.containsKey(placeholder) && !variables.get(placeholder).isBlank()) {
                replacement = variables.get(placeholder);
            }
            matcher.appendReplacement(resolved, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(resolved);
        return resolved.toString();
    }

    private static FileNameRule templateRule(String template, Map<String, String> variables) {
        StringBuilder regex = new StringBuilder("^");
        Matcher matcher = TEMPLATE_PATTERN.matcher(template);
        int lastIndex = 0;
        while (matcher.find()) {
            regex.append(Pattern.quote(template.substring(lastIndex, matcher.start())));
            String placeholder = matcher.group(1).trim();
            if (isDatePlaceholder(placeholder)) {
                regex.append(datePlaceholderToRegex(placeholder));
            } else if (variables.containsKey(placeholder) && !variables.get(placeholder).isBlank()) {
                regex.append(Pattern.quote(variables.get(placeholder)));
            } else {
                regex.append("[^/\\\\]+");
            }
            lastIndex = matcher.end();
        }
        regex.append(Pattern.quote(template.substring(lastIndex)));
        regex.append("$");
        Pattern compiled = Pattern.compile(regex.toString());
        return new FileNameRule(template, fileName -> compiled.matcher(fileName).matches());
    }

    private static boolean isDatePlaceholder(String placeholder) {
        return DATE_PLACEHOLDER_PATTERN.matcher(placeholder).matches();
    }

    private static String datePlaceholderToRegex(String pattern) {
        StringBuilder regex = new StringBuilder();
        for (int index = 0; index < pattern.length(); ) {
            char current = pattern.charAt(index);
            if (Character.isLetter(current)) {
                int end = index + 1;
                while (end < pattern.length() && pattern.charAt(end) == current) {
                    end++;
                }
                int count = end - index;
                regex.append(switch (current) {
                    case 'y', 'M', 'd', 'H', 'h', 'm', 's', 'S' -> "\\d{" + count + "}";
                    default -> Pattern.quote(String.valueOf(current).repeat(count));
                });
                index = end;
            } else {
                regex.append(Pattern.quote(String.valueOf(current)));
                index++;
            }
        }
        return regex.toString();
    }
}
