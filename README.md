# 🚀 DreamDev OS

[![CI/CD Pipeline](https://github.com/Barkasj/DreamDev-OS/actions/workflows/ci.yml/badge.svg)](https://github.com/Barkasj/DreamDev-OS/actions/workflows/ci.yml)
[![Test Coverage](https://img.shields.io/badge/coverage-84.39%25-green.svg)](https://github.com/Barkasj/DreamDev-OS/actions)
[![Dependencies](https://github.com/Barkasj/DreamDev-OS/actions/workflows/dependency-check.yml/badge.svg)](https://github.com/Barkasj/DreamDev-OS/actions/workflows/dependency-check.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black.svg)](https://nextjs.org/)

**AI Orchestration System** yang menghasilkan step-by-step prompts super lengkap menggunakan empat thinking modules: **Logical**, **Analytical**, **Computational**, dan **Procedural**. Sistem ini membantu developer mengubah Product Requirements Document (PRD) menjadi task tree yang terstruktur dan prompt yang actionable.

## ✨ Features

- 🧠 **AI Orchestration**: Sistem orkestrasi AI yang menganalisis PRD dan menghasilkan task tree hierarkis
- 📋 **Prompt Generation**: Menghasilkan prompt terstruktur dan actionable untuk setiap task
- 🗄️ **MongoDB Integration**: Persistensi data dengan MongoDB untuk project dan task management
- 🎯 **Context Management**: Global dan local context tracking untuk dependencies antar task
- 🔧 **Enhanced Debugging**: Comprehensive debugging assistance dan success criteria
- 📱 **Modern UI**: Next.js frontend dengan TypeScript dan Tailwind CSS
- 🧪 **Comprehensive Testing**: 281 tests dengan coverage 84.39%
- 🔄 **CI/CD Pipeline**: Automated testing, building, dan deployment
- 🔒 **Security Scanning**: Automated dependency vulnerability checks

## 🏗️ Architecture

```bash
DreamDev OS/
├── prompt-orchestrator-frontend/    # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   ├── components/             # React Components
│   │   ├── lib/                    # Core Services & Utilities
│   │   ├── services/               # API Client Services
│   │   └── types/                  # TypeScript Interfaces
│   ├── scripts/                    # Database Scripts
│   └── tests/                      # Unit & Integration Tests
└── package.json                    # Root Package Configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ 
- **MongoDB** (local atau MongoDB Atlas)
- **npm** atau **yarn**

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/Barkasj/DreamDev-OS.git
   cd DreamDev-OS
   ```

2. **Install Dependencies**
   ```bash
   cd prompt-orchestrator-frontend
   npm install
   ```

3. **Setup Environment Variables**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   ```
   
   Edit `.env.local` dengan konfigurasi Anda:
   ```env
   MONGODB_URI=mongodb://localhost:27017/dreamdev_os
   MONGODB_DB_NAME=dreamdev_os
   NODE_ENV=development
   ```

4. **Start MongoDB** (jika menggunakan local MongoDB)
   
   Lihat [MongoDB Setup Instructions](MONGODB_SETUP_INSTRUCTIONS.md) untuk panduan lengkap.
   
   ```bash
   # macOS dengan Homebrew
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Browser**
   ```
   http://localhost:3000
   ```

### 🐳 Docker Setup (Alternative)

```bash
# Build dan jalankan dengan Docker Compose
docker-compose up -d

# Akses aplikasi di http://localhost:3000
```

Untuk konfigurasi Docker yang lebih detail, lihat [docker-compose.yml](docker-compose.yml).

## 📋 Usage

### 1. Upload PRD
- Upload file PRD (.txt, .md, .doc, .docx) atau paste text langsung
- Sistem akan menganalisis dan mengekstrak entities (actors, systems, features)
- Contoh PRD dapat dilihat di [sample-prd-context-demo.md](sample-prd-context-demo.md)

### 2. Generate Task Tree
- Sistem menghasilkan task tree hierarkis berdasarkan PRD
- Setiap task memiliki dependencies dan context yang jelas

### 3. Generate Prompts
- Pilih task dari tree untuk menghasilkan prompt terstruktur
- Prompt mencakup objective, context, execution steps, success criteria, dan debugging assistance

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- TaskNodeItem.test.tsx

# Run tests with verbose output
npm test -- --verbose
```

### Test Coverage

| Component | Coverage | Tests | Status |
|-----------|----------|-------|--------|
| PrdUpload | 72.22% | 29 | ✅ |
| PromptDisplay | 93.1% | 14 | ✅ |
| TaskNodeItem | 96.55% | 33 | ✅ |
| TaskTreeDisplay | 60% | 16 | ✅ |
| Core Services | 85.44% | 95 | ✅ |
| API Routes | 89.05% | 24 | ✅ |
| Integration Tests | 100% | 10 | ✅ |
| Security Tests | 93.75% | 16 | ✅ |
| Performance Tests | 100% | 8 | ✅ |
| **Total** | **84.39%** | **281** | ✅ |

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run tests
npm run test:coverage # Run tests with coverage
npm run test:watch   # Run tests in watch mode

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Database (if using local setup)
npm run db:health    # Check database health
```

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB 5.9
- **Testing**: Jest 29, React Testing Library
- **Code Quality**: ESLint, TypeScript
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📊 Performance & Metrics

- **Bundle Size**: 59.7 kB (optimized)
- **First Load JS**: 160 kB
- **Test Coverage**: 84.39% (251/281 tests passing)
- **Build Time**: < 30 seconds
- **TypeScript**: Strict mode enabled
- **ESLint**: Zero errors
- **Dependencies**: Regularly updated & scanned

## 🔄 CI/CD & Automation

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| 🚀 **CI/CD Pipeline** | Push, PR | Lint, test, build, deploy |
| 🔒 **Dependency Check** | Push, PR, Schedule | Security audit, license check |
| 🔄 **Auto Update** | Schedule, Manual | Dependency updates |
| ⚡ **Performance** | Push to main, Schedule | Lighthouse, bundle analysis |

### Automated Features

- ✅ **Continuous Integration**: Automated testing on every push
- 🔒 **Security Scanning**: Weekly dependency vulnerability checks
- 📊 **Performance Monitoring**: Daily Lighthouse audits
- 🔄 **Auto Updates**: Weekly dependency updates via PR
- 📈 **Code Quality**: SonarCloud integration
- ♿ **Accessibility**: Automated a11y testing

### Secrets Configuration

For full CI/CD functionality, configure these secrets in GitHub:

```env
# Deployment (Optional)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Code Quality (Optional)
SONAR_TOKEN=your_sonarcloud_token
SNYK_TOKEN=your_snyk_token
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Workflow

1. **Setup**: Follow [installation instructions](#-quick-start)
2. **Code**: Make your changes with tests
3. **Test**: Run `npm test` and `npm run lint`
4. **Build**: Verify with `npm run build`
5. **PR**: Create PR with detailed description

### Code Standards

- ✅ TypeScript strict mode
- ✅ ESLint compliance
- ✅ Test coverage > 80%
- ✅ Component tests required
- ✅ Accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by DreamDev Team
- Powered by Next.js, MongoDB, and TypeScript
- Icons by Lucide React

---

**DreamDev OS** - Transforming PRDs into actionable development prompts with AI orchestration 🚀
