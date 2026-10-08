import rateLimit from 'express-rate-limit';
import { isTest } from '../../config/env';

const jsonMessage = (error: string) => ({ success: false, error });

// En entorno de test desactivamos los límites para no interferir con las suites.
const skip = () => isTest;

/**
 * Límite estricto para endpoints de autenticación (mitiga fuerza bruta de credenciales).
 * 10 intentos por IP cada 15 minutos.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: jsonMessage('Demasiados intentos de autenticación. Intente nuevamente en unos minutos.'),
});

/**
 * Límite para la generación con IA (protege de abuso y de costos descontrolados).
 * 20 generaciones por IP cada 5 minutos.
 */
export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: jsonMessage('Límite de generaciones con IA alcanzado. Espere unos minutos.'),
});

/** Límite general por defecto para el resto de la API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: jsonMessage('Demasiadas solicitudes. Reduzca la frecuencia.'),
});
