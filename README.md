# Docker-Swarm-Demo
A small Node.js (Express) API deployed on Docker Swarm with 3 replicas. It demonstrates load balancing, scaling, self-healing and rolling updates.
## Project Structure
```
swarm-demo/
├── server.js            # Express API
├── package.json
├── Dockerfile
├── docker-compose.yml   # Stack file for `docker stack deploy`
└── .dockerignore
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Returns the container ID that handled the request |
| `GET /health` | Health check (used by Docker `HEALTHCHECK`) |
| `GET /crash` | Kills the container (self-healing demo only) |

## Quick Start

```bash
# Run locally
npm install
node server.js

# Build the image
docker build -t simple-node-api:1.0 .

# Start Swarm and deploy 3 replicas
docker swarm init
docker service create --name swarm-demo --replicas 3 \
  --publish published=3000,target=3000 simple-node-api:1.0

# Test load balancing (watch the container ID change)
for i in {1..9}; do curl -s http://localhost:3000/ | grep -o '"container":"[^"]*"'; done
```

## Quick Recap

| Step | Action | Proves |
|---|---|---|
| 1-3 | Create and test the app | App works without Docker |
| 4 | `docker build` | Image is correct |
| 5 | `docker swarm init` | Cluster exists |
| 6 | `service create --replicas 3` | Desired state = 3 containers |
| 7 | `curl` loop | Routing mesh load-balances |
| 8 | `service scale` | Elastic capacity |
| 9 | `kill` / `/crash` / `rm` | Swarm reconciles back to 3 |
| 10 | `stack deploy` + `update` | Declarative deploys, rolling updates |

## Basic Docker Swarm Commands

```bash
docker swarm init                          # Turn this machine into a manager
docker swarm join-token worker             # Show the command to add a worker node
docker swarm leave --force                 # Leave (and dissolve) the swarm
docker node ls                             # List nodes in the swarm

docker service create --name swarm-demo --replicas 3 -p 3000:3000 simple-node-api:1.0
docker service ls                          # List services
docker service ps swarm-demo               # Show tasks (containers) of a service
docker service logs -f swarm-demo          # Follow logs from all replicas
docker service inspect --pretty swarm-demo # Human-readable service details
docker service scale swarm-demo=6          # Scale up or down
docker service update --image simple-node-api:2.0 swarm-demo   # Rolling update
docker service rollback swarm-demo         # Undo the last update
docker service rm swarm-demo               # Remove the service
```

## Basic Docker Stack Commands

```bash
docker stack deploy -c docker-compose.yml swarm-demo   # Deploy or update a stack
docker stack ls                                        # List stacks
docker stack services swarm-demo                       # List services in the stack
docker stack ps swarm-demo                             # List all tasks in the stack
docker stack rm swarm-demo                             # Remove the stack
```

Services in a stack are named `<stack>_<service>`, for example `swarm-demo_api`.

## Self-Healing Demo

```bash
# Kill a container; Swarm starts a replacement automatically
docker kill $(docker ps -q | head -n1)
docker service ls        # REPLICAS returns to 3/3

# Crash the app from inside
curl http://localhost:3000/crash
```

## Cleanup

```bash
docker stack rm swarm-demo
docker service rm swarm-demo
docker swarm leave --force
```
