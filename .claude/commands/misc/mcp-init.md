---
description: Initialize project-scoped MCP configuration with .mcp.json
model: claude-sonnet-4-5
---

# Initialize Project-Scoped MCP

Set up a `.mcp.json` file for team-shareable MCP server configurations.

## User Request
$ARGUMENTS

## About Project-Scoped MCP

Claude Code supports three MCP configuration scopes:

| Scope | Location | Use Case |
|-------|----------|----------|
| **User** | `~/.claude.json` | Personal cross-project servers |
| **Project** | `.mcp.json` | Team-shared configurations |
| **Local** | `.claude.json` (project) | Personal project overrides |

**Precedence:** Local > Project > User

## Setup Steps

### 1. Create .mcp.json

```json
{
  "$schema": "https://code.claude.com/schemas/mcp.json",
  "servers": {
    "project-db": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      },
      "description": "Project PostgreSQL database"
    }
  }
}
```

### 2. Add to .gitignore (Secrets)

```gitignore
# Keep local MCP overrides private
.claude.json
```

Note: `.mcp.json` is meant to be committed (no secrets).

### 3. Document Required Environment Variables

Create `.env.example`:
```bash
# Required for MCP servers
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

## Configuration Format

### Basic Server

```json
{
  "servers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name"],
      "description": "What this server does"
    }
  }
}
```

### With Environment Variables

```json
{
  "servers": {
    "server-name": {
      "command": "node",
      "args": ["${PROJECT_ROOT}/scripts/mcp-server.js"],
      "env": {
        "API_KEY": "${API_KEY}",
        "DEBUG": "${DEBUG:-false}"
      }
    }
  }
}
```

### Available Variables

| Variable | Description |
|----------|-------------|
| `${PROJECT_ROOT}` | Project root directory |
| `${HOME}` | User home directory |
| `${VAR}` | Environment variable |
| `${VAR:-default}` | With default value |

## Common Configurations

### Development Database

```json
{
  "servers": {
    "dev-db": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      },
      "description": "Development PostgreSQL"
    }
  }
}
```

### GitHub Integration

```json
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub repository operations"
    }
  }
}
```

### Custom Project Tools

```json
{
  "servers": {
    "project-tools": {
      "command": "node",
      "args": ["${PROJECT_ROOT}/.claude/mcp/tools.js"],
      "description": "Project-specific MCP tools"
    }
  }
}
```

### Supabase

```json
{
  "servers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      },
      "description": "Supabase database and auth"
    }
  }
}
```

## Security Considerations

### Do
- Store `.mcp.json` in version control (no secrets)
- Use environment variables for credentials
- Document required variables in `.env.example`
- Use `${VAR:-default}` for optional configs

### Don't
- Hardcode API keys or passwords
- Commit `.claude.json` (local overrides)
- Share service account keys in repo
- Use production credentials in dev configs

## Confirmation Behavior

Claude Code asks for confirmation before using project-scoped servers:

```
This project wants to use the following MCP servers:
- project-db: Project PostgreSQL database
- github: GitHub repository operations

Allow these servers? [y/N]
```

Reset choices with:
```bash
claude mcp reset-project-choices
```

## Full Example

`.mcp.json`:
```json
{
  "$schema": "https://code.claude.com/schemas/mcp.json",
  "servers": {
    "db": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      },
      "description": "PostgreSQL database for development"
    },
    "redis": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-redis"],
      "env": {
        "REDIS_URL": "${REDIS_URL:-redis://localhost:6379}"
      },
      "description": "Redis cache (defaults to localhost)"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub operations for this repo"
    },
    "project-scripts": {
      "command": "node",
      "args": ["${PROJECT_ROOT}/scripts/mcp/index.js"],
      "description": "Custom project automation tools"
    }
  }
}
```

`.env.example`:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/myapp_dev

# Cache (optional, defaults to localhost)
REDIS_URL=redis://localhost:6379

# GitHub (for PR operations)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## Quick Start

Run this command to automatically:
1. Create `.mcp.json` with common servers
2. Add `.claude.json` to `.gitignore`
3. Create `.env.example` template
4. Show setup instructions

```
/mcp-init
```

Or specify servers to include:
```
/mcp-init postgres github supabase
```

## Troubleshooting

### Server Not Starting
- Check environment variables are set
- Verify npx/node is in PATH
- Check server logs: `claude mcp logs server-name`

### Permission Issues
- Reset choices: `claude mcp reset-project-choices`
- Check file permissions on custom scripts

### Variable Not Resolving
- Ensure variable is exported: `export VAR=value`
- Check for typos in variable names
- Use default syntax for optional: `${VAR:-default}`
