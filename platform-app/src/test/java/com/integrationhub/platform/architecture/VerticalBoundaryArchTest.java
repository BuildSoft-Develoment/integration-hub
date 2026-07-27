package com.integrationhub.platform.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.freeze.FreezingArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-021: TRINQUETE del limite motor &lt;-&gt; verticales.
 *
 * <p>El motor no debe conocer a ningun vertical (SWIFT MT101 hoy, SBS u otros estandares
 * manana): la dependencia va siempre {@code vertical -> motor}, nunca al reves. Hoy ese limite
 * esta roto en varios puntos y pagarlos entero es caro (ver ADR-021 §Contexto), asi que estas
 * reglas van <b>congeladas</b>: las violaciones existentes quedan registradas en
 * {@code archunit_store/} y el build solo falla ante una violacion <b>NUEVA</b>.</p>
 *
 * <p>Es decir: la deuda no crece. Cuando se arregla una violacion hay que quitarla del store
 * (ArchUnit lo hace solo al correr con {@code freeze.refreeze=true}) para que no pueda volver.</p>
 *
 * <p>Antes de esto el proyecto no tenia NINGUN control automatico de capas (ni ArchUnit, ni
 * Checkstyle, ni Enforcer): la separacion por paquetes era pura disciplina.</p>
 */
// @covers ADR-021
class VerticalBoundaryArchTest {

    /** Paquetes de los verticales que todavia viven DENTRO de platform-app (migracion en curso). */
    private static final String VERTICAL_PACKAGES = "..payments..";

    /**
     * ADR-021 parte 2: el vertical ya migrado a su modulo propio. Hay que nombrarlo aparte porque
     * al cambiar de paquete (`com.integrationhub.vertical..`) salio del radar de las reglas de
     * arriba, que solo miran `com.integrationhub.platform`. Sin esta regla, una dependencia nueva
     * del motor hacia el vertical seria INVISIBLE — de hecho asi se colaron 14 imports espurios
     * que un script agrego por menciones en javadoc.
     */
    private static final String VERTICAL_MODULE_PACKAGES = "com.integrationhub.vertical..";

    /** El motor: todo `platform` que no sea un vertical en migracion. */
    private static final String ENGINE_PACKAGES = "com.integrationhub.platform..";

    /** Prefijos de nombre que delatan a un vertical, para detectar clases mal ubicadas. */
    private static final List<String> VERTICAL_CLASS_PREFIXES = List.of("Mt101", "Swift", "Pain001");

    /** Paquetes del motor donde un literal de tipo de tarea de un vertical seria acoplamiento. */
    private static final Path ENGINE_SOURCE_ROOT =
            Path.of("src", "main", "java", "com", "integrationhub", "platform");
    // `api/security` salio de la lista porque el paquete ya no existe: PlatformRoles se fue al SPI y
    // los roles del maker-checker al vertical. Un paquete inexistente se saltaba en silencio, o sea
    // que figurar aca daba una sensacion de cobertura que no era real.
    private static final List<String> ENGINE_SOURCE_PACKAGES =
            List.of("service/execution", "service/process", "domain");

    /**
     * Literales de tipo de tarea de un vertical tolerados HOY en el motor (freeze-list manual:
     * ArchUnit razona sobre tipos, no sobre strings). Cada entrada es deuda registrada en ADR-021;
     * al arreglarla hay que borrarla de aca para que no pueda reaparecer.
     */
    private static final Set<String> FROZEN_LITERAL_FILES = Set.of(
            // "MT101_PAY": el dispatcher de recuperacion decide NEEDS_RECONCILIATION por tipo de tarea.
            "service/execution/async/BackgroundProcessExecutionDispatcher.java",
            // "MT101_PARSE": el fast-path generico excluye el sink que produce records.
            "service/execution/fastpath/FileReadTaskFastPath.java");

    private static JavaClasses platformClasses;

    @BeforeAll
    static void importClasses() {
        platformClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                // ADR-021 parte 2: se importan AMBOS espacios de paquetes. Si solo se mirara
                // `platform`, mover el vertical a su modulo lo sacaria del alcance del trinquete
                // justo cuando mas hace falta vigilarlo.
                .importPackages("com.integrationhub.platform", "com.integrationhub.vertical");
    }

    /**
     * Guardia del propio trinquete: si el importador dejara de VER un espacio de paquetes, todas las
     * reglas de abajo pasarian por vacio y el limite quedaria sin vigilancia — que es exactamente lo
     * que paso al mover el vertical a su modulo (las reglas solo miraban `com.integrationhub.platform`
     * y no lo notaron: se colaron 14 dependencias nuevas del motor hacia el vertical).
     *
     * <p>Un trinquete que se queda ciego es peor que no tenerlo: reporta verde. Los umbrales son
     * deliberadamente bajos — no verifican cuantas clases hay, verifican que AMBOS lados se estan
     * escaneando.</p>
     */
    @Test
    void elTrinqueteVeAmbosEspaciosDePaquetes() {
        var motor = platformClasses.stream()
                .filter(clazz -> clazz.getPackageName().startsWith("com.integrationhub.platform"))
                .count();
        var vertical = platformClasses.stream()
                .filter(clazz -> clazz.getPackageName().startsWith("com.integrationhub.vertical"))
                .count();

        assertTrue(motor > 100, "el trinquete no esta viendo el motor (" + motor + " clases): "
                + "revisar el classpath del ClassFileImporter antes de confiar en las reglas");
        assertTrue(vertical > 50, "el trinquete no esta viendo el modulo del vertical (" + vertical
                + " clases): las reglas pasarian por vacio");
    }

    @Test
    void elMotorNoDependeDelModuloDelVertical() {
        // Complementa la regla de `..payments..`: los verticales YA migrados viven en otro espacio
        // de paquetes. Se exceptuan las clases del propio vertical que siguen en platform-app
        // (migracion en curso) — esas SI pueden usar su modulo.
        ArchRule rule = noClasses()
                .that().resideInAPackage(ENGINE_PACKAGES)
                .and().resideOutsideOfPackage(VERTICAL_PACKAGES)
                .and(new NotVerticalNamedClasses())
                .should().dependOnClassesThat().resideInAPackage(VERTICAL_MODULE_PACKAGES)
                .because("ADR-021: el motor no conoce verticales, vivan en platform-app o en su "
                        + "propio modulo");

        FreezingArchRule.freeze(rule).check(platformClasses);
    }

    @Test
    void elMotorNoDependeDeNingunVertical() {
        ArchRule rule = noClasses()
                .that().resideOutsideOfPackage(VERTICAL_PACKAGES)
                .should().dependOnClassesThat().resideInAPackage(VERTICAL_PACKAGES)
                .because("ADR-021: la dependencia va vertical -> motor, nunca al reves; "
                        + "un vertical nuevo debe darse de alta sin tocar el motor");

        FreezingArchRule.freeze(rule).check(platformClasses);
    }

    @Test
    void lasClasesDeUnVerticalVivenEnSuPaquete() {
        // Complementa la regla anterior: una clase Mt101* ubicada en un paquete del motor no
        // aparece como "dependencia cruzada", pero es acoplamiento igual (y el caso mas comun aca).
        // ADR-021 parte 2: hay DOS hogares validos mientras dura la migracion — el modulo propio
        // del vertical (destino final) y `..payments..` dentro de platform-app (lo aun no movido).
        // Lo que la regla persigue es lo mal ubicado: un Mt101* suelto en api.resource.execution,
        // service.process o entity del motor.
        ArchRule rule = classes()
                .that(new VerticalNamedClasses())
                .should().resideInAnyPackage(VERTICAL_PACKAGES, VERTICAL_MODULE_PACKAGES)
                .because("ADR-021: el codigo de un vertical vive en su modulo (o, mientras migra, "
                        + "en el paquete del vertical), no en paquetes genericos del motor");

        FreezingArchRule.freeze(rule).check(platformClasses);
    }

    @Test
    void elMotorNoHardcodeaTiposDeTareaDeUnVertical() throws IOException {
        var offenders = new ArrayList<String>();
        for (var enginePackage : ENGINE_SOURCE_PACKAGES) {
            var root = ENGINE_SOURCE_ROOT.resolve(enginePackage);
            if (!Files.isDirectory(root)) {
                continue;
            }
            try (Stream<Path> files = Files.walk(root)) {
                for (var file : files.filter(p -> p.toString().endsWith(".java")).toList()) {
                    var relative = relativeToPlatform(file);
                    if (FROZEN_LITERAL_FILES.contains(relative) || isVerticalNamed(file)) {
                        continue;
                    }
                    if (containsVerticalTaskTypeLiteral(file)) {
                        offenders.add(relative);
                    }
                }
            }
        }
        assertTrue(offenders.isEmpty(),
                "ADR-021: el motor no debe hardcodear tipos de tarea de un vertical (usar una "
                        + "capability del SPI). Nuevos incumplimientos: " + offenders);
    }

    /** Busca el literal solo en codigo: ignora comentarios de linea y javadoc. */
    private static boolean containsVerticalTaskTypeLiteral(Path file) throws IOException {
        for (var line : Files.readAllLines(file)) {
            var trimmed = line.stripLeading();
            if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
                continue;
            }
            if (line.contains("\"MT101_") || line.contains("\"PAIN001_") || line.contains("\"SBS_")) {
                return true;
            }
        }
        return false;
    }

    private static boolean isVerticalNamed(Path file) {
        var name = file.getFileName().toString();
        return VERTICAL_CLASS_PREFIXES.stream().anyMatch(name::startsWith);
    }

    private static String relativeToPlatform(Path file) {
        return ENGINE_SOURCE_ROOT.relativize(file).toString().replace('\\', '/');
    }

    /** Negacion de {@link VerticalNamedClasses}: lo que NO delata pertenencia a un vertical. */
    private static final class NotVerticalNamedClasses
            extends com.tngtech.archunit.base.DescribedPredicate<com.tngtech.archunit.core.domain.JavaClass> {

        private NotVerticalNamedClasses() {
            super("no tienen nombre de un vertical");
        }

        @Override
        public boolean test(com.tngtech.archunit.core.domain.JavaClass javaClass) {
            var simpleName = javaClass.getSimpleName();
            return VERTICAL_CLASS_PREFIXES.stream().noneMatch(simpleName::startsWith);
        }
    }

    /** Clases cuyo nombre delata pertenencia a un vertical. */
    private static final class VerticalNamedClasses
            extends com.tngtech.archunit.base.DescribedPredicate<com.tngtech.archunit.core.domain.JavaClass> {

        private VerticalNamedClasses() {
            super("tienen nombre de un vertical (" + String.join("/", VERTICAL_CLASS_PREFIXES) + ")");
        }

        @Override
        public boolean test(com.tngtech.archunit.core.domain.JavaClass javaClass) {
            var simpleName = javaClass.getSimpleName();
            return VERTICAL_CLASS_PREFIXES.stream().anyMatch(simpleName::startsWith);
        }
    }
}
