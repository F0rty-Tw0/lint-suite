# Contributing to Lint Suite

Thank you for your interest in contributing to Lint Suite! This document provides guidelines and instructions for contributing to this project.

## Getting Started

### Prerequisites

- Node.js (v22 or higher)
- npm or yarn

### Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/lint-suite.git`
3. Navigate to the project directory: `cd lint-suite`
4. Install dependencies: `npm install`

## Development Workflow

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Ensure all linting checks pass: `npm run lint`
4. Commit your changes using conventional commits format

## Pull Request Process

1. Update your fork to match the main repository
2. Push your changes to your fork
3. Create a pull request against the main repository
4. Fill in the PR template with all required information
5. Wait for a maintainer to review your PR
6. Address any feedback from the review

## Coding Standards

- Follow the ESLint rules defined in the project
- Write clear commit messages using [Conventional Commits](https://www.conventionalcommits.org/)
- Maintain consistent code style
- Document new rules or configurations
- Include appropriate tests for new features

## Adding New Rules

When adding new ESLint rules or configurations:

1. Add the rule to the appropriate configuration file
2. Document the rule with a comment explaining its purpose
3. Add tests to verify the rule works as expected
4. Update README.md if exposing a new configuration

## Release Process

Maintainers will handle releases following these steps:

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a git tag
4. Push to npm registry

## Questions?

If you have any questions, feel free to open an issue or discussion in the repository.

## Code of Conduct

This project follows a code of conduct that expects all contributors to be respectful and inclusive. Harassment or harmful behavior will not be tolerated.
