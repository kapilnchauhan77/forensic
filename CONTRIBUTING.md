# Contributing to Clario

Thank you for your interest in contributing to Clario! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, versions)
   - Screenshots or logs if applicable

### Suggesting Features

1. **Check existing issues** for similar requests
2. **Open a feature request** with:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach (optional)

### Submitting Code

#### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/forensic_project.git
   cd forensic_project
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/forensic_project.git
   ```
4. Set up development environment (see [Developer Guide](docs/DEVELOPER_GUIDE.md))

#### Development Workflow

1. **Create a branch** from `dev`:
   ```bash
   git checkout dev
   git pull upstream dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow code style guidelines
   - Write/update tests
   - Update documentation if needed

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** to the `dev` branch

#### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add batch fingerprint upload endpoint
fix(frontend): resolve zoom gesture on touch devices
docs(readme): add deployment instructions
test(api): add case CRUD endpoint tests
```

### Pull Request Guidelines

- **Title**: Clear, descriptive summary
- **Description**: Include:
  - What changes were made
  - Why the changes were needed
  - How to test the changes
  - Related issue numbers
- **Size**: Keep PRs focused and reasonably sized
- **Tests**: Include tests for new functionality
- **Documentation**: Update docs if behavior changes

## Code Style

### Python (Backend)

- Follow [PEP 8](https://pep8.org/)
- Use [Black](https://black.readthedocs.io/) for formatting
- Use type hints
- Maximum line length: 88 characters

```python
# Good
def process_fingerprint(
    fingerprint_id: str,
    preset: str = "rolled_plain"
) -> ProcessingResult:
    """Process a fingerprint with the specified preset."""
    ...
```

### TypeScript (Frontend)

- Follow ESLint configuration
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use descriptive variable names

```typescript
// Good
const handleFingerprintUpload = useCallback(async (file: File) => {
  try {
    const result = await fingerprintsApi.upload(exhibitId, file);
    setFingerprints(prev => [...prev, result.data]);
  } catch (error) {
    toast.error('Upload failed');
  }
}, [exhibitId]);
```

## Testing

### Backend Tests

```bash
cd backend
pytest
pytest --cov=app  # With coverage
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Documentation

- Update README.md for user-facing changes
- Update API_REFERENCE.md for API changes
- Update DEVELOPER_GUIDE.md for development process changes
- Add inline code comments for complex logic

## Getting Help

- Read the [Developer Guide](docs/DEVELOPER_GUIDE.md)
- Check existing issues and discussions
- Ask questions in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Clario!
