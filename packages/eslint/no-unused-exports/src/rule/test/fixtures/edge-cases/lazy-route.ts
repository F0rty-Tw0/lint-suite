export const lazyRoutes = [
  {
    path: 'lazy',
    load: () => import('./target').then((module) => module.alpha)
  }
];
