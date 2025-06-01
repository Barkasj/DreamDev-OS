# 🤝 Contributing to DreamDev-OS

Thank you for your interest in contributing to DreamDev-OS! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Release Process](#release-process)

## 📜 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with newcomers
- **Focus on what's best** for the community

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/DreamDev-OS.git
   cd DreamDev-OS
   ```

2. **Install Dependencies**
   ```bash
   cd prompt-orchestrator-frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Workflow Steps

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code following our standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📏 Coding Standards

### TypeScript Guidelines

- Use **strict mode** TypeScript
- Prefer **interfaces** over types for object shapes
- Use **explicit return types** for functions
- Avoid **any** type - use proper typing

```typescript
// ✅ Good
interface UserData {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<UserData> {
  // implementation
}

// ❌ Bad
function getUser(id: any): any {
  // implementation
}
```

### React Guidelines

- Use **functional components** with hooks
- Prefer **named exports** over default exports
- Use **TypeScript interfaces** for props
- Follow **React hooks rules**

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ❌ Bad
export default function Button(props: any) {
  return <button onClick={props.onClick}>{props.children}</button>;
}
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── features/       # Feature-specific components
├── lib/                # Core business logic
├── services/           # API and external services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── __tests__/          # Test files
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names

## 🧪 Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows

### Writing Tests

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Requirements

- **Coverage**: Minimum 70% for new code
- **Component Tests**: Required for all new components
- **Service Tests**: Required for all business logic
- **Integration Tests**: Required for complex features

## 📝 Pull Request Process

### Before Creating PR

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] TypeScript compiles without errors

### PR Description Template

Use our PR template and include:

- **Description** of changes
- **Type of change** (bug fix, feature, etc.)
- **Testing** information
- **Screenshots** (if UI changes)
- **Breaking changes** (if any)

### Review Process

1. **Automated Checks**: CI/CD pipeline runs
2. **Code Review**: Maintainer reviews code
3. **Testing**: Manual testing if needed
4. **Approval**: At least one approval required
5. **Merge**: Squash and merge to main

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template and include:

- **Clear description** of the issue
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details**
- **Screenshots** if applicable

### Feature Requests

Use the feature request template and include:

- **Problem statement**
- **Proposed solution**
- **Use cases**
- **Acceptance criteria**
- **Mockups** if applicable

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority:high` - High priority issue

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**: Update package.json version
2. **Update Changelog**: Document all changes
3. **Create Release**: Tag and create GitHub release
4. **Deploy**: Automated deployment via CI/CD

## 🛠️ Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Git Hooks

We use Husky for git hooks:

- **pre-commit**: Lint and format code
- **commit-msg**: Validate commit message format
- **pre-push**: Run tests

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(auth): add user authentication
fix(ui): resolve button alignment issue
docs(readme): update installation instructions
test(api): add unit tests for user service
```

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Request Comments**: Code-specific discussions

### Maintainer Response Time

- **Issues**: Within 48 hours
- **Pull Requests**: Within 72 hours
- **Security Issues**: Within 24 hours

## 🙏 Recognition

Contributors will be recognized in:

- **README**: Contributors section
- **Release Notes**: Major contributions
- **GitHub**: Contributor graph and stats

Thank you for contributing to DreamDev-OS! 🚀