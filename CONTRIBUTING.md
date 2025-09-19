# Contributing to GrabtoGo

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Alex-Invenex/grabtogo.git
   cd grabtogo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` files in each service/app directory
   - Fill in the required environment variables

4. **Start development servers**
   ```bash
   npm run dev
   ```

## Project Structure

This is a monorepo managed with Turborepo. Each package has its own:
- `package.json` with standardized scripts
- `tsconfig.json` extending the base configuration
- `eslint.config.mjs` for code quality

## Code Standards

- **TypeScript**: All code must be written in TypeScript
- **ESLint**: Run `npm run lint` before committing
- **Formatting**: Code is automatically formatted on commit
- **Testing**: Write tests for new features

## Commit Guidelines

- Use conventional commit messages
- Run `npm run type-check` before committing
- Ensure all tests pass

## Development Workflow

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Commit with descriptive messages
5. Create a pull request

## Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run type-check` - Check TypeScript types
- `npm run test` - Run all tests
- `npm run clean` - Clean build artifacts