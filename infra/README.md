# Infraestructura Terraform de verificación

Esta configuración aprovisiona una red Docker, PostgreSQL y la aplicación en un runner efímero de GitHub Actions. Los puertos se vinculan exclusivamente a loopback. La infraestructura se destruye al terminar la verificación.

El workflow conserva validación, pruebas HTTP y un reporte de costos que distingue el costo incremental de los recursos Docker de los posibles minutos facturables de GitHub Actions. No se publica el estado Terraform ni los secretos generados.

Esta verificación no constituye un despliegue público persistente de TestGenAI. Ese despliegue debe documentarse por separado con su proveedor, URL y costos efectivos.
