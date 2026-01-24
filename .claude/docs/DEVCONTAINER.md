# DevContainer Guide

This guide explains how to use the DevContainer configuration for secure, isolated Claude Code development.

## What is a DevContainer?

A DevContainer (Development Container) is a Docker-based development environment that:
- **Isolates** your development from your host system
- **Standardizes** the environment across team members
- **Secures** file access to only your project
- **Pre-configures** all necessary tools

## Benefits

### 1. Security Isolation

**File System Sandboxing**
- Claude Code can only access files within your project
- No access to `~/.ssh`, `~/.aws`, or other sensitive directories
- Prevents accidental modification of system files

**Network Restrictions**
- Optional firewall limits outbound connections
- Whitelist-only access to approved services
- Prevents data exfiltration

### 2. Reproducible Environment

**Consistent Setup**
- Same Node.js version (20 LTS)
- Same Claude Code version
- Same development tools
- Works identically on any machine

**No "Works on My Machine"**
- New team members get identical setup
- CI/CD uses same environment
- Debugging is consistent

### 3. Pre-installed Tools

The DevContainer includes:
- **Node.js 20** - JavaScript runtime
- **Claude Code** - Latest version
- **TypeScript** - Type checking
- **Playwright** - E2E testing
- **Git** - Version control
- **ripgrep** - Fast search
- **jq** - JSON processing

### 4. VS Code Integration

**Recommended Extensions**
- Claude Code extension
- ESLint + Prettier
- Playwright test runner
- Tailwind CSS IntelliSense
- GitLens

**Pre-configured Settings**
- Format on save
- TypeScript strict mode
- Consistent code style

## Getting Started

### Prerequisites

1. **Docker Desktop** installed and running
2. **VS Code** with **Remote - Containers** extension
3. At least **4GB RAM** allocated to Docker

### Opening in DevContainer

**Option 1: VS Code Command**
1. Open project in VS Code
2. Press `F1` → "Dev Containers: Reopen in Container"
3. Wait for container to build (~2-5 minutes first time)

**Option 2: Click Notification**
- VS Code will prompt "Reopen in Container" when detecting `.devcontainer/`

**Option 3: Command Line**
```bash
code --folder-uri vscode-remote://dev-container+$(pwd)
```

### First Time Setup

On first launch:
1. Container image builds (cached for future use)
2. VS Code extensions install
3. Claude Code authenticates (if not cached)

```
Building container...
Installing extensions...
Running postCreateCommand...
Claude Code Dev Environment Ready!
```

## Configuration

### devcontainer.json

Key settings explained:

```json
{
  // Container name in Docker
  "name": "Lorenzo's Claude Code Dev Environment",

  // Use our Dockerfile
  "build": {
    "dockerfile": "Dockerfile",
    "args": {
      "CLAUDE_CODE_VERSION": "latest"
    }
  },

  // Additional dev tools
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },

  // VS Code customizations
  "customizations": {
    "vscode": {
      "extensions": [...],
      "settings": {...}
    }
  },

  // Persist Claude auth across rebuilds
  "mounts": [
    "source=claude-config,target=/home/node/.claude,type=volume"
  ],

  // Environment variables
  "containerEnv": {
    "NODE_OPTIONS": "--max-old-space-size=4096"
  },

  // Port forwarding
  "forwardPorts": [3000, 5432, 6379]
}
```

### Dockerfile

The Dockerfile:
1. Starts from `node:20-bookworm`
2. Installs system dependencies
3. Installs Claude Code globally
4. Configures non-root user
5. Sets up development tools

### Firewall (Optional)

The `init-firewall.sh` script can restrict network access:

**Permissive Mode** (Default)
- All outbound traffic allowed
- Good for development

**Strict Mode** (Uncomment rules)
- Only approved destinations allowed:
  - GitHub (git operations)
  - Anthropic API (Claude)
  - npm registry (packages)
  - Supabase (database)
  - Vercel (deployments)

To enable strict mode:
```bash
# Edit .devcontainer/init-firewall.sh
# Uncomment the iptables rules
# Rebuild container
```

## Persistence

### What Persists

- **Claude configuration**: `~/.claude` volume survives rebuilds
- **Git credentials**: Forwarded from host
- **Project files**: Mounted from host

### What Doesn't Persist

- **Global npm packages**: Reinstalled on rebuild
- **Container modifications**: Lost on rebuild
- **Temporary files**: Cleared on rebuild

### Persisting Additional Data

Add mounts in `devcontainer.json`:
```json
"mounts": [
  "source=claude-config,target=/home/node/.claude,type=volume",
  "source=npm-cache,target=/home/node/.npm,type=volume"
]
```

## Troubleshooting

### Container Won't Start

**Docker not running**
```bash
# Start Docker Desktop or:
sudo systemctl start docker
```

**Port conflict**
```bash
# Check what's using port 3000
lsof -i :3000
# Or change forwardPorts in devcontainer.json
```

### Claude Code Not Working

**Authentication required**
```bash
# In container terminal:
claude auth login
```

**Version mismatch**
```bash
# Rebuild with latest:
# F1 → "Dev Containers: Rebuild Container"
```

### Slow Performance

**Increase Docker memory**
- Docker Desktop → Settings → Resources → Memory: 8GB+

**Use faster file sync**
```json
// In devcontainer.json
"mounts": [
  "source=${localWorkspaceFolder},target=/workspaces/${localWorkspaceFolderBasename},type=bind,consistency=cached"
]
```

### Extensions Not Loading

**Rebuild container**
- F1 → "Dev Containers: Rebuild Container"

**Check extension compatibility**
- Some extensions don't work in containers
- Check extension's "Remote" support

## Best Practices

1. **Commit devcontainer.json**: Share environment with team
2. **Use volumes for caches**: Speed up rebuilds
3. **Pin versions**: Avoid surprise updates
4. **Document customizations**: Help team understand setup
5. **Test in container**: Before pushing changes

## Comparison

| Feature | Local Development | DevContainer |
|---------|------------------|--------------|
| Setup time | Variable | Consistent |
| Security | Full system access | Sandboxed |
| Reproducibility | Varies | Guaranteed |
| Resource usage | Native | +Docker overhead |
| File access | All files | Project only |
| Network access | Unrestricted | Configurable |

## FAQ

**Q: Do I need DevContainer?**
A: No, but it's recommended for security and consistency.

**Q: Will it slow down my machine?**
A: Slightly. Docker adds ~10-20% overhead. Mitigate with more RAM.

**Q: Can I use my local tools?**
A: Host tools aren't available. Install in Dockerfile or use features.

**Q: How do I update Claude Code?**
A: Rebuild container or run `npm install -g @anthropic-ai/claude-code@latest`.

**Q: Can I customize the container?**
A: Yes! Edit Dockerfile and devcontainer.json for your needs.
