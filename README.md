# Rama de estado de la VM de produccion

Esta rama **no contiene codigo**. Solo `estado.yaml`, que dice que version debe correr en la VM de
GCP. Es la regla D2 del
[ADR-030](https://github.com/BuildSoft-Develoment/integration-hub/blob/main/docs/fase-3-arquitectura/adr/ADR-030-despliegue-automatizado-vm-pull-aprobacion-rollback.md).

## Por que una rama aparte

Por dos razones, y ninguna es estetica.

**Ningun workflow la observa.** Los disparadores del repositorio son `main`, `develop`, tags `v*` y
ejecucion manual. Una rama propia es inerte por construccion.

**Y bajo `ops/` en `develop` costaria doce minutos por aprobacion.** `ops/**` se quito a proposito de
la lista de rutas inertes de `entrega-continua-int.yml` —ahi vive `Dockerfile.native`—, asi que
cambiar una linea con un tag lanzaria una compilacion nativa completa y un redespliegue de
integracion. En cada despliegue y en cada rollback.

## Como se cambia

**Nunca a mano.** Un workflow propone el cambio como pull request contra esta rama, y **fusionarlo es
la aprobacion** (D3). De ahi salen tres cosas gratis: se ve el diff (`tag: A -> B`), el veredicto
A/B/C del clasificador cabe en el cuerpo del pull request, y queda un commit con autor y fecha.

Un **rollback** usa el mismo camino: se escribe en `tag` el valor de `tag_estable`. No hay un
procedimiento especial que se oxide por no usarse.

## Estado inicial

Los dos tags nacen **vacios**, y es correcto: hoy no hay despliegue automatizado que los rellene. El
agente de la VM no debe hacer nada mientras `tag` este vacio. Se rellenan en el primer despliegue
aprobado.

## No borrar

Esta rama es el registro de que version debe correr y desde cuando. Borrarla pierde ese historial.
