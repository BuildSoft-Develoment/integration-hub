package com.integrationhub.platform.service.process;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.spi.process.ProcessDefinitionValidator;
import com.integrationhub.platform.spi.process.ProcessTaskView;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

/**
 * El {@code taskRef} identifica una tarea DENTRO de su proceso: dos tareas del mismo proceso no pueden
 * compartirlo.
 *
 * <p><b>Por que importa.</b> No es un nombre decorativo, es el identificador de cableado del pipeline:
 * {@code input.sourceTaskRef} apunta a el para consumir la salida de otra tarea, y en el money-path
 * {@code resolvesPayTaskRef} lo usa para declarar a que {@code MT101_PAY} concilia un {@code MT101_STATUS}.
 * Con dos tareas del mismo nombre, quien resuelve la referencia toma la primera que coincide — o sea que
 * ADIVINA. En el cableado eso arma un pipeline distinto del que el operador dibujo; en el money-path
 * significa conciliar contra un pago que no es.</p>
 *
 * <p>El caso del money-path es el mas grave y ademas es silencioso: {@code Mt101PayResolverPairing} exige
 * {@code resolvesPayTaskRef} cuando hay varios PAY —con el mensaje "no guessing across banks/connections"—
 * pero al resolverlo hace {@code findFirst()} sobre los que coinciden. Con {@code taskRef} repetidos la
 * garantia no se cumple: solo se traslada de "no declaraste" a "declaraste algo que no distingue".</p>
 *
 * <p><b>Vacio se permite.</b> Una tarea terminal que nadie referencia no necesita nombre, y exigirselo
 * rechazaria definiciones validas que existen hoy. Lo que no puede haber es el MISMO nombre dos veces.</p>
 *
 * <p><b>Alcance.</b> Solo mira las tareas que le llegan, que el motor ya filtra por {@code active}: una
 * version vieja dada de baja logicamente no compite por el nombre con la vigente.</p>
 */
@ApplicationScoped
public class TaskRefUniquenessValidator implements ProcessDefinitionValidator {

    private final ObjectMapper objectMapper;

    @Inject
    public TaskRefUniquenessValidator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void validate(List<ProcessTaskView> tasks) {
        if (tasks == null || tasks.size() < 2) {
            return;
        }
        var porTaskRef = new LinkedHashMap<String, List<ProcessTaskView>>();
        for (var task : tasks) {
            var taskRef = taskRefOf(task);
            if (taskRef != null) {
                porTaskRef.computeIfAbsent(taskRef, ignored -> new ArrayList<>()).add(task);
            }
        }
        var repetidos = porTaskRef.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .map(entry -> "'" + entry.getKey() + "' (task orders " + ordersOf(entry.getValue()) + ")")
                .toList();
        if (repetidos.isEmpty()) {
            return;
        }
        throw new IllegalArgumentException(
                "Duplicate taskRef in the same process: " + String.join(", ", repetidos)
                + ". A taskRef identifies a task within its process: input.sourceTaskRef wires the pipeline "
                + "by it, and MT101_STATUS.resolvesPayTaskRef names which MT101_PAY it reconciles. With two "
                + "tasks sharing a name the reference resolves to whichever comes first — it guesses. Give "
                + "each task its own taskRef, or leave it blank on tasks nobody references.");
    }

    private String taskRefOf(ProcessTaskView task) {
        if (task == null || task.configurationJson() == null || task.configurationJson().isBlank()) {
            return null;
        }
        try {
            var node = objectMapper.readTree(task.configurationJson()).get("taskRef");
            if (node == null || node.isNull()) {
                return null;
            }
            var taskRef = node.asText("").trim();
            // Vacio no identifica nada, asi que no compite por el nombre con nadie.
            return taskRef.isEmpty() ? null : taskRef;
        } catch (com.fasterxml.jackson.core.JsonProcessingException ignored) {
            // Config a medio escribir: la rechaza quien la parsea de verdad, no este validador.
            return null;
        }
    }

    private static String ordersOf(List<ProcessTaskView> tasks) {
        return tasks.stream()
                .map(task -> String.valueOf(task.taskOrder()))
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
    }
}
