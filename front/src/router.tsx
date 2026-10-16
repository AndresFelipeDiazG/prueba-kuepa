/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from "react-router-dom";
import NotFound from '@/pages/not-found/not-found';
import { Skeleton } from "./components/ui/skeleton";
import Leads from './pages/leads/leads';
import { AppLayout } from './components/layouts/app-layout';
import Home from './pages/home/home';

const Login = lazy(() => import('@/pages/auth/login')); 
const router = createBrowserRouter([
  {
    path: '/auth',
    element: 
    <Suspense fallback={<Loading mode="logo" />}>
      <Login />
    </Suspense>
  },
  {
    path: '/',
    element: 
    <Suspense fallback={<Loading mode="logo" />}>
      <Login />
    </Suspense>
  },
  {
    path: '/leads',
    element: 
      <AppLayout module="crm" window="contact">
        <Suspense fallback={<Loading mode="logo" />}>
          <Leads />
        </Suspense>
      </AppLayout>
  },
  {
    path: '/home',
    element: 
      <AppLayout module="crm" window="contact">
        <Suspense fallback={<Loading mode="logo" />}>
          <Home />
        </Suspense>
      </AppLayout>
  },
  {
    path: "*",
    element: 
      <NotFound />
  }
]);

window['router'] = router

 function Loading ({mode}:{mode?:string}) {
  if(!mode){
    return (
      <Skeleton className=" w-[92vw] lg:w-[72vw] mx-auto h-[88vh] md:h-[90vh] shadow-md rounded-lg scale-[0.99]" />
    )
  } else if (mode === 'logo'){
    return (
      <div className="flex w-[100vw] h-[100vh] items-center justify-center">
        <div className="z-20 flex items-center text-4xl bg-white w-fit px-4 py-2 rounded-md font-bold font-brand">
          <img src="/logo.jpeg" alt="logo" className="w-36 h-36 mr-2 animate-bounce" />
        </div>
      </div>
    )
  }
 }

export default router;