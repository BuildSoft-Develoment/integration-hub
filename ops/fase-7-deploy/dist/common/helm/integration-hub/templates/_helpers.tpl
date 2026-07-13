{{- define "integration-hub.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "integration-hub.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "integration-hub.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "integration-hub.labels" -}}
app.kubernetes.io/name: {{ include "integration-hub.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}

{{- define "integration-hub.selectorLabels" -}}
app.kubernetes.io/name: {{ include "integration-hub.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "integration-hub.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "integration-hub.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "integration-hub.image" -}}
{{- printf "%s:%s" .Values.image.repository (default .Chart.AppVersion .Values.image.tag) -}}
{{- end -}}
