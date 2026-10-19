# Private deployment templates

Copy `env.production.example` to `/opt/apps/oma-studio/.env.ops`, replace the
two passwords, and create the configured host directories. Keep state outside
release directories so an upgrade or rollback never replaces metadata, Pi
sessions, workspace files, logs, or provider credentials.

Set `PI_HOST_AGENTS_HOME` to the host directory containing shared,
agent-neutral skills. Compose mounts it at `/home/node/.agents`, independently
from `PI_HOST_HOME`; do not replace this mount with a symlink.

The deployment script requires this directory to exist before it recreates the
container, so a missing mount cannot silently hide the community skill catalog.
The directory is mounted independently; existing skills in `PI_HOST_HOME` are
not moved automatically.

Deploy with the root Compose definition plus this production overlay. The
Compose definition publishes FastAPI on loopback by default for a separately
managed TLS reverse proxy, so production stays reachable only through NGINX
unless `OMA_BIND_ADDRESS` is set explicitly. It does not add a proxy or
represent `PI_CWD` as a sandbox.

On startup the application creates/tightens platform SQLite, WAL/SHM/journal and
schema backup files to `0600`, retaining their owner. New data directories are
`0700`. Existing bind mounts must remain owned by the container's app UID (1000);
do not use recursive permission changes on workspace or Pi session directories.
If an existing database belongs to a different user, correct ownership for the
specific metadata files before restarting; the app fails rather than silently
opening a broadly readable metadata file. Check the resulting modes after
deployment. Host disk encryption and external backup permissions are separate
operations.

Bootstrap/default account passwords are configuration secrets in `.env.ops`;
keep that file at `0600`. The app removes those passwords from Pi/Marketplace
child environments. Those processes still share the app's OS identity, so this
is not a process/filesystem isolation boundary (see issue #123).

Authentication limits use Uvicorn's resolved client address. Trust forwarded
addresses only from the actual reverse proxy; without that configuration, all
users arriving through an untrusted proxy share the client failure budget.

```bash
docker compose --env-file /opt/apps/oma-studio/.env.ops \
  -f docker-compose.yml -f deploy/docker-compose.production.yaml config -q
```
