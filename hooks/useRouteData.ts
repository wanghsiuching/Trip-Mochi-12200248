/**
 * useRouteData stub for backward compatibility
 * Prevents Vercel/GitHub build failures during transitional deployment
 */
export const useRouteData = () => {
  return {
    routes: [],
    activeRoute: null,
    setActiveRoute: () => {},
  };
};

export default useRouteData;
