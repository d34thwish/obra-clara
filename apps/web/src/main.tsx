import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles.css';
import { Layout } from './components/Layout';
import { Home } from './routes/Home';
import { Search, Institutions, Suppliers, Procurements } from './routes/Lists';
import { Institution, Supplier, Procurement } from './routes/Profiles';
import {
  Explore,
  Signals,
  OpenData,
  Method,
  Community,
  Contribute,
  Compare,
  About,
} from './routes/Other';
import { Admin } from './routes/Admin';
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/buscar', element: <Search /> },
      { path: '/explorar', element: <Explore /> },
      { path: '/instituciones', element: <Institutions /> },
      { path: '/instituciones/:id', element: <Institution /> },
      { path: '/proveedores', element: <Suppliers /> },
      { path: '/proveedores/:id', element: <Supplier /> },
      { path: '/contrataciones', element: <Procurements /> },
      { path: '/contrataciones/:id', element: <Procurement /> },
      { path: '/senales', element: <Signals /> },
      { path: '/comparar', element: <Compare /> },
      { path: '/datos', element: <OpenData /> },
      { path: '/comunidad', element: <Community /> },
      { path: '/comunidad/proponer', element: <Contribute /> },
      { path: '/metodologia', element: <Method /> },
      { path: '/acerca', element: <About /> },
      { path: '/admin', element: <Admin /> },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
