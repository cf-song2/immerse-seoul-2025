# Immerse Seoul 2025
- You only need Cloudflare resources to build an full-stack applications!

# System Architecture

```mermaid
flowchart TD
    Browser["User Browser\nReact SPA (Pages/Worker)"] --> WorkerAPI
    
    subgraph WorkerAPI["Cloudflare Workers API"]
        Register["/api/auth/register"] 
        Login["/api/auth/login"]
        Logout["/api/auth/logout"]
        Verify["/api/auth/verify"]
        Generate["/api/generate"]
        Images["/api/images"]
    end
    
    WorkerAPI --> WorkersAI
    WorkerAPI --> R2
    WorkerAPI --> D1
    WorkerAPI --> KV
    
    subgraph WorkersAI["Workers AI"]
        SDXL["Stable Diffusion XL"]    
    end
    
    subgraph R2["R2 Bucket"]
        ImageFiles["Image Files (.png)"]    
    end
    
    subgraph D1["D1 Database"]
        Users["users"]    
        Images2["images"]    
    end
    
    subgraph KV["KV Store"]
        Sessions["Sessions"]
        AuthTokens["Auth Tokens"]    
    end
```


# Project Tree 

```mermaid
graph TD
    root["ai-image-generator/"] --> src
    root --> pages-app
    root --> wrangler["wrangler.toml"]
    root --> schema["schema.sql"]
    root --> package["package.json"]
    root --> readme["README.md"]
    
    src --> worker["worker.js: Main Worker API"]
    src --> auth
    src --> handlers
    src --> utils
    
    auth --> auth_js["auth.js: 인증 로직"]
    auth --> jwt["jwt.js: JWT 토큰 처리"]
    auth --> middleware["middleware.js: 인증 미들웨어"]
    
    handlers --> images_js["images.js: 이미지 관련 핸들러"]
    handlers --> users_js["users.js: 사용자 관련 핸들러"]
    
    utils --> crypto["crypto.js: 암호화 유틸"]
    utils --> response["response.js: 응답 헬퍼"]
    
    pages-app --> pages_src["src/"]
    pages-app --> public["public/"]
    pages-app --> pages_package["package.json"]
    pages-app --> vite["vite.config.js"]
    pages-app --> tailwind["tailwind.config.js"]
    pages-app --> postcss["postcss.config.js"]
    
    pages_src --> App["App.jsx"]
    pages_src --> main["main.jsx"]
    pages_src --> index_css["index.css"]
    pages_src --> components
    pages_src --> hooks
    pages_src --> services
    
    components --> Auth
    components --> Generator
    components --> Gallery
    
    Auth --> Login["Login.jsx"]
    Auth --> Register["Register.jsx"]
    Auth --> AuthGuard["AuthGuard.jsx"]
    
    Generator --> ImageGenerator["ImageGenerator.jsx"]
    Gallery --> ImageGallery["ImageGallery.jsx"]
    
    hooks --> useAuth["useAuth.js"]
    services --> api["api.js"]
```

You can also view the directory structure in text format:

```
ai-image-generator/
├── src/
│   ├── worker.js              # Main Worker API
│   ├── auth/
│   │   ├── auth.js           # 인증 로직
│   │   ├── jwt.js            # JWT 토큰 처리
│   │   └── middleware.js     # 인증 미들웨어
│   ├── handlers/
│   │   ├── images.js         # 이미지 관련 핸들러
│   │   └── users.js          # 사용자 관련 핸들러
│   └── utils/
│       ├── crypto.js         # 암호화 유틸
│       └── response.js       # 응답 헬퍼
├── pages-app/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx           
│   │   ├── main.jsx          
│   │   ├── index.css         
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── AuthGuard.jsx
│   │   │   ├── Generator/
│   │   │   │   └── ImageGenerator.jsx
│   │   │   └── Gallery/
│   │   │       └── ImageGallery.jsx
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   └── services/
│   │       └── api.js
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── wrangler.toml             
├── schema.sql                
├── package.json              
└── README.md
```

# AI Image Generator with Authentication

A full-stack AI image generation application built with Cloudflare Workers, Workers AI, and React.

## Features

- 🎨 AI-powered image generation using Stable Diffusion XL
- 🔐 User authentication with JWT tokens
- 📊 Rate limiting (10 images per day per user)
- 🌐 Public/private image gallery
- 💾 Image storage in R2
- 📱 Responsive React frontend

## Setup

### Prerequisites

- Node.js 16+
- Cloudflare account
- Wrangler CLI installed

## Installation

```bash
make install
make db-init
make secrets

make init-pages
make deploy-pages
```
