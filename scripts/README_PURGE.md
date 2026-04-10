Purge history helper
====================

Este directorio contiene scripts para purgar artefactos y posibles secretos del historial Git usando `git-filter-repo`.

Requisitos
---------
- Python con `git-filter-repo` instalado (`python -m pip install --user git-filter-repo`).
- Git en la PATH.

Uso seguro (recomendado)
-----------------------
1. Haz una copia de seguridad del repositorio remoto y local.
2. Desde la raíz del repo local, ejecuta:

```bash
# Ejecuta en Bash (Linux/macOS/WSL/Cygwin/Git Bash)
./scripts/purge-history.sh

# o en PowerShell (Windows)
./scripts/purge-history.ps1
```

Ambos scripts crean un espejo en el directorio temporal, ejecutan `git-filter-repo` para eliminar `dist/` y `.angular/` y aplicar las reglas de `replacements.txt`.

No empujan cambios al remoto por defecto. Revisa el mirror resultante y, si todo está OK, empuja con:

```bash
cd /tmp/purge-repos/<repo>-mirror.git
git push --mirror --force origin
```

Notas de seguridad
------------------
- Después de forzar un push, todos los colaboradores deben clonar el repositorio de nuevo.
- Rota inmediatamente cualquier clave potencialmente expuesta (ej. `SUPABASE_SERVICE_ROLE_KEY`).
