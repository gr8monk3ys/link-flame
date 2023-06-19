---
description: Set up GitHub integration for Claude Code (PR reviews, security scans)
---

# GitHub Integration Setup

Configure GitHub integration for automated PR reviews and security scanning.

## Arguments
$ARGUMENTS

## Quick Setup

The fastest way to set up GitHub integration:

```bash
# In Claude Code terminal
/install-github-app
```

This interactive wizard will:
1. Create or select a GitHub App
2. Configure required permissions
3. Set up repository secrets
4. Test the integration

## Manual Setup

### Step 1: Create GitHub App

1. Go to **GitHub Settings** → **Developer settings** → **GitHub Apps**
2. Click **New GitHub App**
3. Configure:
   - **Name**: `Claude Code Review` (or your choice)
   - **Homepage URL**: Your repo URL
   - **Webhook**: Disable (not needed)

4. **Permissions**:
   - **Repository permissions**:
     - Contents: Read
     - Issues: Read & Write
     - Pull requests: Read & Write
     - Metadata: Read
   - **Subscribe to events**: None needed

5. Click **Create GitHub App**

### Step 2: Generate Private Key

1. In your GitHub App settings
2. Scroll to **Private keys**
3. Click **Generate a private key**
4. Save the `.pem` file securely

### Step 3: Install App on Repository

1. In GitHub App settings → **Install App**
2. Select your repository
3. Click **Install**

### Step 4: Configure Secrets

Add these secrets to your repository (**Settings** → **Secrets and variables** → **Actions**):

```
ANTHROPIC_API_KEY    # Your Anthropic API key
GITHUB_APP_ID        # From GitHub App settings
GITHUB_APP_PRIVATE_KEY  # Contents of .pem file
```

### Step 5: Add Workflow Files

The plugin includes pre-configured workflows:
- `.github/workflows/claude-pr-review.yml`
- `.github/workflows/claude-security-scan.yml`

These are already set up if you're using this plugin.

## Configuration Options

### Model Selection

In workflow files, configure the model:

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    # Fast, cost-effective reviews
    model: claude-sonnet-4-5-20251101

    # Thorough, complex analysis
    model: claude-opus-4-5-20251101
```

### Trigger Configuration

#### On Every PR
```yaml
on:
  pull_request:
    types: [opened, synchronize]
```

#### On @claude Mention Only
```yaml
on:
  issue_comment:
    types: [created]

jobs:
  review:
    if: contains(github.event.comment.body, '@claude')
```

#### On Specific File Changes
```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - '!src/**/*.test.ts'
```

### Review Customization

Customize what Claude reviews:

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    prompt: |
      Focus your review on:
      1. Security vulnerabilities
      2. TypeScript type safety
      3. React best practices
      4. Performance implications

      Ignore:
      - Styling preferences
      - Comment style

      Our standards:
      - No `any` types
      - All functions must have return types
      - Use async/await over .then()
```

## Features

### PR Review
- Code quality analysis
- Security vulnerability detection
- Performance suggestions
- Best practice recommendations
- Inline code suggestions

### Security Scanning
- OWASP Top 10 checks
- Dependency vulnerability alerts
- Hardcoded secret detection
- Authentication/authorization review
- Input validation verification

### Interactive Mode
Mention `@claude` in PR comments to:
- Ask questions about the code
- Request specific analysis
- Get implementation suggestions
- Discuss architecture decisions

## Troubleshooting

### "Resource not accessible by integration"
- Check GitHub App permissions
- Reinstall the app on the repository
- Verify webhook secret if using webhooks

### "ANTHROPIC_API_KEY not found"
- Add secret to repository settings
- Check secret name matches workflow

### Reviews Not Triggering
- Check workflow file syntax
- Verify trigger conditions match your PR
- Check Actions tab for workflow runs

### Rate Limiting
- Anthropic API has rate limits
- Consider using Sonnet for routine reviews
- Use Opus for complex PRs only

## Usage Examples

### Request Review
In a PR comment:
```
@claude Please review this PR focusing on security
```

### Ask Questions
```
@claude How does this change affect the authentication flow?
```

### Request Changes
```
@claude Can you suggest a more efficient implementation for the sorting function?
```

## Best Practices

1. **Start with Sonnet**: Use Opus only for complex reviews
2. **Configure Focus Areas**: Tell Claude what matters most
3. **Protect Main Branch**: Require review before merge
4. **Review the Reviews**: Claude suggestions are recommendations
5. **Iterate on Prompts**: Customize prompts based on feedback

## Cost Optimization

| Review Type | Model | Approx. Cost |
|-------------|-------|--------------|
| Quick scan | Sonnet | ~$0.01-0.05 |
| Full review | Sonnet | ~$0.05-0.20 |
| Security audit | Opus | ~$0.20-0.50 |
| Complex analysis | Opus | ~$0.50-2.00 |

Tips:
- Use path filters to review only changed code
- Skip auto-generated files
- Batch small PRs when possible
