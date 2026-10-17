/**
 * Hexagonal / Clean Architecture Dependency Container
 * Exposes wired repositories and use cases to the Presentation layer.
 */

import { CalcularMetricasAsistenciaUseCase } from './application/use-cases/CalcularMetricasAsistenciaUseCase';
import { FirebaseLocalAsistenciaRepository } from './infrastructure/repositories/FirebaseLocalAsistenciaRepository';
import { FirebaseLocalIglesiaRepository } from './infrastructure/repositories/FirebaseLocalIglesiaRepository';
import { FirebaseLocalMiembroRepository } from './infrastructure/repositories/FirebaseLocalMiembroRepository';

export const iglesiaRepository = new FirebaseLocalIglesiaRepository();
export const miembroRepository = new FirebaseLocalMiembroRepository();
export const asistenciaRepository = new FirebaseLocalAsistenciaRepository();

export const calcularMetricasAsistenciaUseCase = new CalcularMetricasAsistenciaUseCase();
