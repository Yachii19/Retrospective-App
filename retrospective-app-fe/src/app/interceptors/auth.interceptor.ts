import { HttpInterceptorFn } from '@angular/common/http';

const PUBLIC_ROUTES = [
  '/auth/register',
  '/auth/login',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/reset-password'
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublic = PUBLIC_ROUTES.some(route => req.url.includes(route));

  if (isPublic) {
    return next(req); // ← skip token for public routes
  }

  const token = localStorage.getItem('token');

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};