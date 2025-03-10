import { BrowserRouter as Router, Routes, Route, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { notification } from "antd";

import LoginPage from "./page/login";
import StudyList from "./page/studyList";
import StudyUpload from "./page/studyUpload";
import Splash from "./page/splash";
import BaseLayout from "./page/baseLayout";
import { ROUTES_LIST } from "./constant/route.constant";
import { GlobalProvider } from "./context/globalContext";

function App() {
  // Configure Ant Design notifications when the component mounts.
  useEffect(() => {
    notification.config({
      placement: "topRight",
      duration: 2,
      top: 10,
    });
  }, []);

  // Memoize the QueryClient to avoid recreating it on every render.
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
          },
        },
      }),
    []
  );

  // Router list ================================================
  const router = createBrowserRouter([
    {
      path: ROUTES_LIST.SPLASH_ROUTE,
      element: <Splash/>
    }, 
    {
      path: ROUTES_LIST.LOGIN_ROUTE, 
      element: <LoginPage/>
    }, 
    {
      path: ROUTES_LIST.STUDYLIST_ROUTE, 
      element: <BaseLayout
        element={<StudyList/>}
      />
    }, 
    {
      path: ROUTES_LIST.STUDYUPLOAD_ROUTE, 
      element: <BaseLayout element={<StudyUpload/>} />
    }
  ])

  return (
    <GlobalProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}/>
      </QueryClientProvider>
    </GlobalProvider>
  );
}

export default App;
