#### Cheat sheet Git: GitHub + GitLab (doble remoto)

Asume `origin` = GitHub (fuente de verdad, fetch/pull) con doble push hacia GitHub y GitLab. Si aún no lo configuraste, hazlo una vez:

```bash
# Fetch lee de GitHub
git remote set-url origin https://github.com/TU_USUARIO/TU_REPO.git
# Push va a los dos
git remote set-url --add --push origin https://github.com/TU_USUARIO/TU_REPO.git
git remote set-url --add --push origin https://gitlab.com/shinyadaniel0-group/filtro-ats.git
# (opcional) remoto gitlab nombrado para leer puntualmente
git remote add gitlab https://gitlab.com/shinyadaniel0-group/filtro-ats.git
git remote -v   # verificar: 1 fetch, 2 push
```

**Día a día (config doble-push activa)**

```bash
git status                 # ver estado
git add .                  # preparar cambios (o: git add archivo)
git commit -m "mensaje"    # commit local
git push                   # empuja a GitHub Y GitLab a la vez
git pull                   # trae y fusiona desde GitHub (fuente de verdad)
git fetch                  # solo descarga, no fusiona
```

**Push / Pull / Fetch explícito por plataforma**

```bash
# PUSH
git push origin main       # ambos (por config doble-push)
git push gitlab main       # SOLO GitLab

# FETCH (descargar sin fusionar)
git fetch origin           # GitHub
git fetch gitlab           # GitLab
git fetch --all            # todos los remotos

# PULL (descargar + fusionar)
git pull origin main       # desde GitHub
git pull gitlab main       # desde GitLab
```

**Sincronizar manualmente ambos lados (si divergen)**

```bash
git fetch --all
git checkout main
git merge origin/main      # alinear con GitHub
git merge gitlab/main      # alinear con GitLab (resuelve conflictos si aparecen)
git push                   # propaga a ambos
```

**Ramas**

```bash
git branch                       # listar locales
git branch -a                    # incluir remotas
git checkout -b nueva-rama       # crear y cambiar
git checkout main                # cambiar de rama
git push -u origin nueva-rama    # publicar rama (a ambos remotos)
git branch -d nueva-rama         # borrar local
git push origin --delete rama    # borrar remota
```

**Inspección / deshacer**

```bash
git log --oneline -10            # historial corto
git diff                         # cambios sin preparar
git diff --staged                # cambios preparados
git restore archivo              # descartar cambios locales de un archivo
git reset --soft HEAD~1          # deshacer último commit, conserva cambios
git stash / git stash pop        # guardar / recuperar cambios temporales
```

**Comprobar que GitHub y GitLab están idénticos**

```bash
git fetch --all
git rev-parse origin/main gitlab/main   # si imprime el mismo SHA dos veces -> sincronizados
```

#### En VS Code

- Botón **Sync Changes** (barra inferior, ícono ↻) = `pull` + `push`, respeta el doble-push.
- Panel **Source Control** (Ctrl/Cmd+Shift+G): stage, commit y push con clic.
- **...** del panel → *Pull from* / *Push to* para elegir remoto específico (GitHub o GitLab).

**Recordatorios clave**
- `commit` siempre es local; nada llega a los servidores hasta el `push`.
- Mantén **GitHub como fuente de verdad** para leer; GitLab actúa como espejo de escritura.
- Si un `push` falla en un remoto (rechazo por divergencia), los dos pueden quedar desincronizados: resuelve y vuelve a `push`.
- Para HTTPS necesitas token/credential manager en ambos; para `git@...` necesitas claves SSH en ambos.
