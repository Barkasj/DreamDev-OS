# 🚀 DreamDev OS

**AI Orchestration System** yang menghasilkan step-by-step prompts super lengkap menggunakan empat thinking modules: **Logical**, **Analytical**, **Computational**, dan **Procedural**.

## ✨ Features

- 🧠 **AI Orchestration**: Sistem orkestrasi AI yang menganalisis PRD dan menghasilkan task tree hierarkis
- 📋 **Prompt Generation**: Menghasilkan prompt terstruktur dan actionable untuk setiap task
- 🗄️ **MongoDB Integration**: Persistensi data dengan MongoDB untuk project dan task management
- 🎯 **Context Management**: Global dan local context tracking untuk dependencies antar task
- 🔧 **Enhanced Debugging**: Comprehensive debugging assistance dan success criteria
- 📱 **Modern UI**: Next.js frontend dengan TypeScript dan Tailwind CSS

## 🏗️ Architecture

```
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
   npm run install-deps
   ```

3. **Setup MongoDB**
   ```bash
   cd prompt-orchestrator-frontend
   # Edit .env.local dengan MongoDB connection string
   # Ganti <db_password> dengan password yang sebenarnya:
   # MONGODB_URI=mongodb+srv://kooetimu1999:<db_password>@cluster0.f2bdrfx.mongodb.net/dreamdev_os?retryWrites=true&w=majority
   ```

4. **Test MongoDB Connection**
   ```bash
   npm run db:health
   ```

5. **Initialize Database**
   ```bash
   npm run db:init
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Open Browser**
   ```
   http://localhost:3000
   ```

## 📋 Usage

### 1. Upload PRD
- Upload file PRD (.txt, .md, .doc, .docx) atau paste text langsung
- Sistem akan menganalisis dan mengekstrak entities (actors, systems, features)

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
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run db:health    # Check database health
```

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB 5.9
- **Testing**: Jest, ts-jest
- **Icons**: Lucide React

## 📊 Performance

- **Bundle Size**: 59.7 kB (optimized)
- **First Load JS**: 160 kB
- **Test Coverage**: 100% (29/29 tests passing)
- **Build Time**: < 30 seconds

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by DreamDev Team
- Powered by Next.js, MongoDB, and TypeScript
- Icons by Lucide React

---

**DreamDev OS** - Transforming PRDs into actionable development prompts with AI orchestration 🚀
