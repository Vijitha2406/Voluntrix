# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Local backend (Express + MongoDB)

This project includes a simple Express + Mongoose backend in the `server/` folder.

Setup

1. Copy `server/.env.example` to `server/.env` and update `MONGO_URI` and `JWT_SECRET`.
2. From the repo root run:

```cmd
cd server
npm install
npm run dev
```

This starts the API on port 4000 by default. The frontend expects the API at `http://localhost:4000`. You can set a different base URL for the frontend using a Vite env variable `VITE_API_BASE`.
