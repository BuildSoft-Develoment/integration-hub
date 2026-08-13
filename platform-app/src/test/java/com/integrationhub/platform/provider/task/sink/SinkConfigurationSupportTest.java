package com.integrationhub.platform.provider.task.sink;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * La composicion de la clave destino es lo unico de esta clase que puede fallar en silencio: una clave mal
 * compuesta se sube igual, nadie ve un error, y el archivo aparece donde nadie lo busca.
 */
class SinkConfigurationSupportTest {

    @Test
    void elDropPathAbsolutoSeInterpretaRelativoAlPrefijo() {
        // Sin quitar la barra, "envios" + "/SUCAVE/x.txt" daria "envios//SUCAVE/x.txt": una clave VALIDA en
        // un object store, y por eso peligrosa — se sube sin error a una carpeta que nadie esta mirando.
        assertEquals("envios/SUCAVE/x.txt", SinkConfigurationSupport.joinPrefix("envios", "/SUCAVE/x.txt"));
    }

    @Test
    void elPrefijoConBarraFinalNoDuplicaLaBarra() {
        assertEquals("envios/x.txt", SinkConfigurationSupport.joinPrefix("envios/", "x.txt"));
    }

    @Test
    void sinPrefijoLaClaveEsElDropPathSinBarraInicial() {
        assertEquals("x.txt", SinkConfigurationSupport.joinPrefix(null, "/x.txt"));
        assertEquals("x.txt", SinkConfigurationSupport.joinPrefix("", "/x.txt"));
        assertEquals("x.txt", SinkConfigurationSupport.joinPrefix("   ", "x.txt"));
    }

    @Test
    void unValorEnBlancoEsAusencia() {
        // Un campo que el usuario dejo con espacios no es un valor: si contara como valor, un 'prefix' de
        // " " compondria claves con un espacio dentro.
        var config = new HashMap<String, Object>();
        config.put("prefix", "   ");
        assertNull(SinkConfigurationSupport.optionalString(config, "prefix"));
        assertEquals("por-defecto", SinkConfigurationSupport.optionalString(config, "prefix", "por-defecto"));
    }

    @Test
    void unPrefijoConPlantillaSeRechazaEnVezDeEscribirseLiteral() {
        // La misma definicion /sources se lee de las dos formas: al LEER, `envios/{yyyyMM}/` se resuelve
        // a `envios/202608/`; al escribir no hay tal resolucion. Sin este rechazo, la entrega crearia una
        // carpeta llamada literalmente "{yyyyMM}" y el archivo desapareceria de la vista sin ningun error.
        var error = assertThrows(IllegalArgumentException.class,
                () -> SinkConfigurationSupport.joinPrefix("envios/{yyyyMM}", "0228A01.228"));

        assertTrue(error.getMessage().contains("dropPathTemplate"),
                () -> "debe decir donde SI va la fecha: " + error.getMessage());
    }

    @Test
    void unPrefijoNormalNoSeConfundeConUnaPlantilla() {
        assertEquals("envios-2026/x.txt", SinkConfigurationSupport.joinPrefix("envios-2026", "x.txt"));
    }

    @Test
    void elErrorDeUnCampoObligatorioNombraElSink() {
        // Quien lee esto esta mirando un proceso que no entrego; "requires 'bucket'" sin decir cual de los
        // destinos no le sirve de nada.
        var error = assertThrows(IllegalArgumentException.class,
                () -> SinkConfigurationSupport.requireString(Map.of(), "bucket", "S3"));
        assertTrue(error.getMessage().contains("S3"), error.getMessage());
        assertTrue(error.getMessage().contains("bucket"), error.getMessage());
    }
}
